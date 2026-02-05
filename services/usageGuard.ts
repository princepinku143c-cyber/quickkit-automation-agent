
import { db } from './firebase';
import { UserPlan, PlanTier } from '../types';
import { PLAN_LIMITS } from '../constants';
import firebase from 'firebase/compat/app';

const USERS_COLLECTION = 'users';

/**
 * Checks if the user is allowed to use AI features based on their plan.
 * If allowed, atomically increments the 'aiUsed' counter.
 */
export const checkAndIncrementAI = async (uid: string): Promise<boolean> => {
    if (!db) return true; // Fallback if offline
    
    const userRef = db.collection(USERS_COLLECTION).doc(uid);

    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            if (!doc.exists) return false;

            const userData = doc.data() as UserPlan;
            const plan = PLAN_LIMITS[userData.tier] || PLAN_LIMITS.FREE;
            const usage = userData.aiUsed || 0;

            if (usage >= plan.AI_PROMPTS) {
                return false; // Limit Reached
            }

            // Allowed: Increment usage
            transaction.update(userRef, { 
                aiUsed: firebase.firestore.FieldValue.increment(1) 
            });
            return true;
        });
    } catch (e) {
        console.error("Usage Guard Error:", e);
        return false; // Fail safe
    }
};

/**
 * Checks if user can create a new workflow.
 * DOES NOT increment anything, just a read check.
 */
export const canCreateWorkflow = (userPlan: UserPlan, currentProjectCount: number): boolean => {
    const limit = PLAN_LIMITS[userPlan.tier].PROJECTS;
    return currentProjectCount < limit;
};

/**
 * Checks if user can add more nodes to a workflow.
 */
export const canAddNode = (userPlan: UserPlan, currentNodeCount: number): boolean => {
    const limit = PLAN_LIMITS[userPlan.tier].MAX_NODES;
    return currentNodeCount < limit;
};
