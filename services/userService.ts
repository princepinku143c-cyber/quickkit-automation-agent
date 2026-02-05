
import { db } from './firebase';
import { UserPlan } from '../types';
import firebase from 'firebase/compat/app';

// COLLECTION REF
const USERS_COLLECTION = 'users';

/**
 * Ensures a user profile exists in Firestore after login.
 * If not, creates a new one with the default 'FREE' plan.
 */
export const ensureUserProfile = async (user: firebase.User): Promise<UserPlan> => {
    if (!db) throw new Error("Firestore not initialized");
    if (!user) throw new Error("No user provided");

    const userRef = db.collection(USERS_COLLECTION).doc(user.uid);
    
    try {
        const doc = await userRef.get();

        if (doc.exists) {
            // Update last login time
            await userRef.update({ 
                lastLoginAt: Date.now() 
            });
            return doc.data() as UserPlan;
        } else {
            // CREATE NEW PROFILE
            const newProfile: UserPlan = {
                uid: user.uid,
                email: user.email || '',
                tier: 'FREE',
                region: 'GLOBAL', // Can be updated later via IP check
                role: 'USER',
                status: 'active',
                credits: 5, // Default Free Credits
                aiUsed: 0, // 🔥 Tracks cumulative usage
                monthlyLimit: 5,
                createdAt: Date.now(),
                onboardingDone: false, // Critical for UX flow
                autoRenew: false,
                updatedAt: Date.now(),
                expiresAt: 0 // Never expires for free plan
            };

            await userRef.set(newProfile);
            return newProfile;
        }
    } catch (error) {
        console.error("Error in ensureUserProfile:", error);
        throw error;
    }
};

/**
 * Fetch the full user profile including plan details.
 */
export const getUserProfile = async (uid: string): Promise<UserPlan | null> => {
    if (!db) return null;
    try {
        const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
        if (doc.exists) {
            return doc.data() as UserPlan;
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
};

/**
 * Update specific fields in the user profile (e.g. completing onboarding).
 */
export const updateUserProfile = async (uid: string, updates: Partial<UserPlan>) => {
    if (!db) return;
    try {
        await db.collection(USERS_COLLECTION).doc(uid).update({
            ...updates,
            updatedAt: Date.now()
        });
    } catch (error) {
        console.error("Error updating profile:", error);
    }
};
