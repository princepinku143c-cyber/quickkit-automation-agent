
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
                region: 'GLOBAL', 
                role: 'USER', // Default Role
                status: 'active',
                credits: 5,
                aiUsed: 0, 
                monthlyLimit: 5,
                usage: {
                    workflows: 0,
                    runs: 0,
                    apiCalls: 0
                },
                warningSent: false, // 🔥 NEW: Initialize warning flag
                createdAt: Date.now(),
                onboardingDone: false,
                autoRenew: false,
                updatedAt: Date.now(),
                expiresAt: 0 
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
 * Subscribe to realtime profile updates.
 */
export const subscribeToUserProfile = (
    uid: string,
    onData: (profile: UserPlan | null) => void,
    onError?: (error: Error) => void
) => {
    if (!db) {
        onData(null);
        return () => {};
    }

    return db.collection(USERS_COLLECTION).doc(uid).onSnapshot(
        (doc) => onData(doc.exists ? (doc.data() as UserPlan) : null),
        (error) => {
            console.error('Error subscribing to user profile:', error);
            if (onError) onError(error as Error);
        }
    );
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

/**
 * ⚡ ADMIN TOOL: Promotes a user to ADMIN by email.
 * Run this from the browser console during development:
 * window.nexusPromote('your@email.com')
 */
export const debugPromoteUser = async (email: string) => {
    if (!db) return;
    console.log(`Searching for ${email}...`);
    const snapshot = await db.collection(USERS_COLLECTION).where('email', '==', email).limit(1).get();
    
    if (snapshot.empty) {
        console.error("User not found!");
        return;
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({ role: 'ADMIN' });
    console.log(`✅ SUCCESS: ${email} is now an ADMIN.`);
    window.location.reload();
};
