
import { db } from './firebase';
import { UserPlan, UserUsage } from '../types';
import { PLAN_LIMITS } from '../constants';
import firebase from 'firebase/compat/app';

const USERS_COLLECTION = 'users';

// --- 🧠 CORE ENGINE LOGIC ---

/**
 * Checks if the usage cycle needs a reset (Monthly Rolling).
 * Applies to ALL users (Free & Paid) to ensure quotas refresh.
 */
function _checkMonthlyReset(userData: UserPlan): { needsReset: boolean; updates: Record<string, any> } {
    const now = Date.now();
    const lastReset = userData.lastUsageReset || userData.createdAt || 0;
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

    // If more than 30 days have passed since last reset
    if (now - lastReset > oneMonthMs) {
        // Fallback logic for monthly limit source
        const resetLimit = userData.plan?.monthlyLimit ?? userData.monthlyLimit ?? 5;
        return {
            needsReset: true,
            updates: {
                'usage.workflows': 0,
                'usage.runs': 0,
                'usage.apiCalls': 0,
                'plan.credits': resetLimit,
                warningSent: false,
                lastUsageReset: now
            }
        };
    }
    return { needsReset: false, updates: {} };
}

/**
 * Resolves plan state, expiry, and resets.
 */
function _resolveEffectivePlan(userData: UserPlan): { 
    effectiveTier: string; 
    updates: Record<string, any>;
} {
    const now = Date.now();
    let updates: Record<string, any> = {};
    let effectiveTier = userData.tier;

    // 1. Check Expiry (Downgrade Logic)
    if (userData.tier !== 'FREE' && userData.tier !== 'BUSINESS' && userData.expiresAt && userData.expiresAt < now) {
        // Plan Expired -> Downgrade
        effectiveTier = 'FREE';
        updates = {
            ...updates,
            'plan.tier': 'FREE',
            'plan.status': 'expired',
            'plan.credits': 5,
            tier: 'FREE', // Sync
            // We don't reset usage here, we let the monthly check handle it, or reset it now
            // Safe bet: Reset usage on downgrade to Free tier limits
            'usage.workflows': 0,
            'usage.runs': 0,
            'usage.apiCalls': 0,
            lastUsageReset: now
        };
    }

    // 2. Check Monthly Reset (Lazy Cron)
    // Only run this if we haven't already decided to reset via downgrade
    if (!updates['lastUsageReset']) {
        const resetCheck = _checkMonthlyReset(userData);
        if (resetCheck.needsReset) {
            console.log(`[UsageGuard] Triggering Monthly Reset for ${userData.uid}`);
            updates = { ...updates, ...resetCheck.updates };
        }
    }

    return { effectiveTier, updates };
}

/**
 * Generic Transaction Handler.
 * Calculates limits, applies resets, and increments usage.
 */
async function _processUsageTransaction(
    uid: string, 
    metric: keyof UserUsage, 
    cost: number
): Promise<boolean> {
    if (!db) return true;
    if (cost === 0) return true;

    // 🔥 BYPASS FOR DEV USER
    if (uid === 'dev-bypass-user-999') return true;

    const userRef = db.collection(USERS_COLLECTION).doc(uid);

    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            if (!doc.exists) return true;

            const userData = doc.data() as UserPlan;
            const { effectiveTier, updates } = _resolveEffectivePlan(userData);

            // 1. Ensure usage object exists if we are about to increment it
            if (!userData.usage) {
                transaction.set(userRef, { 
                    usage: { workflows: 0, runs: 0, apiCalls: 0 } 
                }, { merge: true });
            }

            // 2. Apply Lazy Updates (Downgrade or Monthly Reset)
            if (Object.keys(updates).length > 0) {
                transaction.update(userRef, updates);
            }

            // 3. Bypass for Business (Unlimited)
            if (effectiveTier === 'BUSINESS' || effectiveTier === 'ELITE') {
                transaction.update(userRef, { 
                    [`usage.${metric}`]: firebase.firestore.FieldValue.increment(cost) 
                });
                return true;
            }

            // 3. Check Limits
            // If we just reset usage in 'updates', consider current usage as 0
            const isResetting = !!updates['usage.runs'];
            const currentUsage = isResetting ? 0 : (userData.usage?.[metric] || 0);
            
            const limits = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
            let limitValue = 0;

            if (metric === 'apiCalls') limitValue = limits.API_CALLS;
            if (metric === 'runs') limitValue = limits.RUNS;
            if (metric === 'workflows') limitValue = limits.PROJECTS;

            if (currentUsage + cost > limitValue) {
                // If we are strictly checking, block.
                // NOTE: If we just downgraded/reset, we allow this first call.
                if (!isResetting) {
                    console.warn(`[UsageGuard] Limit Reached (${metric}): ${currentUsage}/${limitValue}`);
                    return false;
                }
            }

            // 4. Increment
            const fieldUpdates: any = {
                [`usage.${metric}`]: firebase.firestore.FieldValue.increment(cost)
            };

            // Sync legacy credits field
            if (metric === 'apiCalls') {
                fieldUpdates['plan.credits'] = firebase.firestore.FieldValue.increment(-cost);
                fieldUpdates['aiUsed'] = firebase.firestore.FieldValue.increment(cost);
            }

            transaction.update(userRef, fieldUpdates);
            return true;
        });
    } catch (e) {
        console.error(`[UsageGuard] Transaction Error:`, e);
        return false;
    }
}

// --- PUBLIC API ---

export const verifyProjectCreationLimit = async (uid: string): Promise<void> => {
    if (!db) return;
    if (uid === 'dev-bypass-user-999') return;
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data() as UserPlan;
    const { effectiveTier } = _resolveEffectivePlan(userData);

    if (effectiveTier === 'BUSINESS' || effectiveTier === 'ELITE') return;

    const limit = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS]?.PROJECTS || 2;
    const current = userData.usage?.workflows || 0;

    if (current >= limit) {
        throw new Error(`PROJECT_LIMIT_REACHED`);
    }
};

export const checkAndConsumeCredit = async (uid: string, cost: number = 1): Promise<boolean> => {
    return _processUsageTransaction(uid, 'apiCalls', cost);
};

export const checkRunLimit = async (uid: string): Promise<boolean> => {
    return _processUsageTransaction(uid, 'runs', 1);
};

// Client-Side Visual Checks
export const canCreateWorkflow = (userPlan: UserPlan, currentProjectCount: number): boolean => {
    const { effectiveTier } = _resolveEffectivePlan(userPlan);
    if (effectiveTier === 'BUSINESS' || effectiveTier === 'ELITE') return true;
    const limit = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS]?.PROJECTS || 2;
    const usage = userPlan.usage?.workflows ?? currentProjectCount;
    return usage < limit;
};

export const canAddNode = (userPlan: UserPlan, currentNodeCount: number): boolean => {
    const { effectiveTier } = _resolveEffectivePlan(userPlan);
    if (effectiveTier === 'BUSINESS' || effectiveTier === 'ELITE') return true;
    const limit = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS]?.MAX_NODES || 10;
    return currentNodeCount < limit;
};
