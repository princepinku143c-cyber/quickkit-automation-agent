
import { db } from './firebase';
import { UserPlan } from '../types';
import { PLAN_LIMITS } from '../constants';
import firebase from 'firebase/compat/app';

const USERS_COLLECTION = 'users';

/**
 * Checks if the user has enough credits and atomically consumes them.
 * Returns TRUE if action allowed, FALSE if blocked.
 */
export const checkAndConsumeCredit = async (uid: string, cost: number = 1): Promise<boolean> => {
    if (!db) return true; // Fallback if DB not ready
    if (cost === 0) return true;

    const userRef = db.collection(USERS_COLLECTION).doc(uid);

    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            
            // Allow if user doesn't exist yet (will be created) or error reading
            if (!doc.exists) return true;

            const userData = doc.data() as UserPlan;
            const currentCredits = userData.credits || 0;

            // Business Plan Bypass (Unlimited)
            if (userData.tier === 'BUSINESS') {
                transaction.update(userRef, { 
                    aiUsed: firebase.firestore.FieldValue.increment(cost) 
                });
                return true; 
            }

            // Check Balance
            if (currentCredits < cost) {
                console.warn(`[Usage Guard] Blocked: Has ${currentCredits}, Needs ${cost}`);
                return false; 
            }

            // Deduct Credits
            transaction.update(userRef, { 
                credits: firebase.firestore.FieldValue.increment(-cost),
                aiUsed: firebase.firestore.FieldValue.increment(cost) 
            });
            
            return true;
        });
    } catch (e) {
        console.error("Usage Guard Transaction Failed:", e);
        // Fail safe: Block if error to protect resources, or Allow if critical UX? 
        // Choosing Block for safety.
        return false; 
    }
};

export const canCreateWorkflow = (userPlan: UserPlan, currentProjectCount: number): boolean => {
    if (userPlan.tier === 'BUSINESS') return true;
    const limit = PLAN_LIMITS[userPlan.tier]?.PROJECTS || 1;
    return currentProjectCount < limit;
};

export const canAddNode = (userPlan: UserPlan, currentNodeCount: number): boolean => {
    if (userPlan.tier === 'BUSINESS') return true;
    const limit = PLAN_LIMITS[userPlan.tier]?.MAX_NODES || 10;
    return currentNodeCount < limit;
};
