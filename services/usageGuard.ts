
import { db } from './firebase';
import { UserPlan, UserUsage } from '../types';
import { PLAN_LIMITS } from '../constants';
import firebase from 'firebase/compat/app';

const USERS_COLLECTION = 'users';

// --- 🧠 CORE ENGINE LOGIC (Private) ---

/**
 * Resolves the true state of a user's plan.
 * Checks expiry dates and enforces auto-downgrade logic.
 * Returns the effective data and any necessary DB updates.
 */
function _resolveEffectivePlan(userData: UserPlan): { 
    effectiveTier: string; 
    isExpired: boolean; 
    updates: Record<string, any>;
} {
    const now = Date.now();
    
    // 1. Check if plan is time-expired
    if (userData.tier !== 'FREE' && userData.tier !== 'BUSINESS' && userData.expiresAt && userData.expiresAt < now) {
        // Prepare downgrade payload
        return {
            effectiveTier: 'FREE',
            isExpired: true,
            updates: {
                tier: 'FREE',
                'plan.tier': 'FREE', // Deep update
                'plan.status': 'expired',
                expiresAt: 0,
                credits: 5, // Reset legacy credits to Free tier baseline
                usage: { workflows: 0, runs: 0, apiCalls: 0 }, // Reset usage on downgrade
                warningSent: false
            }
        };
    }

    return {
        effectiveTier: userData.tier,
        isExpired: false,
        updates: {}
    };
}

/**
 * Generic Transaction Handler for all Usage types.
 * @param uid User ID
 * @param metric The usage metric to check/increment ('runs' | 'apiCalls' | 'workflows')
 * @param cost How much to increment
 * @returns boolean (Allowed/Denied)
 */
async function _processUsageTransaction(
    uid: string, 
    metric: keyof UserUsage, 
    cost: number
): Promise<boolean> {
    if (!db) return true; // Fail-open if DB unavailable (Auth/Network issue)
    if (cost === 0) return true;

    const userRef = db.collection(USERS_COLLECTION).doc(uid);

    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            
            // Allow if user doesn't exist yet (will be created by auth hook)
            if (!doc.exists) return true;

            const userData = doc.data() as UserPlan;
            const { effectiveTier, isExpired, updates } = _resolveEffectivePlan(userData);

            // 1. Apply Downgrade if needed
            if (isExpired) {
                console.log(`[CoreEngine] Auto-downgrading user ${uid} to FREE.`);
                transaction.update(userRef, updates);
            }

            // 2. Bypass for Business Tier (Unlimited)
            if (effectiveTier === 'BUSINESS') {
                // Still track usage for analytics
                transaction.update(userRef, { 
                    [`usage.${metric}`]: firebase.firestore.FieldValue.increment(cost) 
                });
                return true;
            }

            // 3. Check Limits against Effective Tier
            // Use local usage variable if we just reset it, otherwise DB value
            const currentUsage = isExpired ? 0 : (userData.usage?.[metric] || 0);
            
            const limits = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
            let limitValue = 0;

            if (metric === 'apiCalls') limitValue = limits.API_CALLS;
            if (metric === 'runs') limitValue = limits.RUNS;
            if (metric === 'workflows') limitValue = limits.PROJECTS;

            if (currentUsage + cost > limitValue) {
                console.warn(`[CoreEngine] Limit Reached (${metric}): ${currentUsage}/${limitValue}`);
                return false;
            }

            // 4. Increment Usage
            const fieldUpdates: any = {
                [`usage.${metric}`]: firebase.firestore.FieldValue.increment(cost)
            };

            // Legacy Sync for 'credits' (only for apiCalls)
            if (metric === 'apiCalls') {
                fieldUpdates['credits'] = firebase.firestore.FieldValue.increment(-cost);
                fieldUpdates['aiUsed'] = firebase.firestore.FieldValue.increment(cost);
            }

            transaction.update(userRef, fieldUpdates);
            return true;
        });
    } catch (e) {
        console.error(`[CoreEngine] Transaction Failed (${metric}):`, e);
        return false;
    }
}

// --- 🚀 PUBLIC API (WRAPPERS) ---

/**
 * Checks if user is allowed to create a new project.
 * Throws an error if limit reached to block DB write.
 */
export const verifyProjectCreationLimit = async (uid: string): Promise<void> => {
    if (!db) return; // Allow if offline/no-db (Guest mode logic handled elsewhere)

    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!userDoc.exists) return; // Should allow, profile might be creating

    const userData = userDoc.data() as UserPlan;
    const { effectiveTier } = _resolveEffectivePlan(userData);

    // Business is Unlimited
    if (effectiveTier === 'BUSINESS') return;

    const limit = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS]?.PROJECTS || 3;
    const current = userData.usage?.workflows || 0;

    if (current >= limit) {
        throw new Error(`PROJECT_LIMIT_REACHED`);
    }
};

/**
 * Checks and consumes AI Credits.
 * Used by: AIAssistant, AI Nodes.
 */
export const checkAndConsumeCredit = async (uid: string, cost: number = 1): Promise<boolean> => {
    return _processUsageTransaction(uid, 'apiCalls', cost);
};

/**
 * Checks if user can execute a workflow run.
 * Used by: ExecutionEngine, RunModal.
 */
export const checkRunLimit = async (uid: string): Promise<boolean> => {
    return _processUsageTransaction(uid, 'runs', 1);
};

// --- VISUAL CHECKS (Client-Side Only) ---
// These are for UI disabling. The actual enforcement happens in DB write rules or the functions above.

export const canCreateWorkflow = (userPlan: UserPlan, currentProjectCount: number): boolean => {
    const { effectiveTier } = _resolveEffectivePlan(userPlan);
    if (effectiveTier === 'BUSINESS') return true;
    
    const limit = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS]?.PROJECTS || 3;
    // Prefer usage counter from DB object, fallback to passed count (length of array)
    const usage = userPlan.usage?.workflows ?? currentProjectCount;
    
    return usage < limit;
};

export const canAddNode = (userPlan: UserPlan, currentNodeCount: number): boolean => {
    const { effectiveTier } = _resolveEffectivePlan(userPlan);
    if (effectiveTier === 'BUSINESS') return true;
    
    const limit = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS]?.MAX_NODES || 10;
    return currentNodeCount < limit;
};
