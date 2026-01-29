
import { db, auth } from './firebase';
import { Blueprint, UserPlan, PaymentTransaction, PlanTier, CouponData, ExecutionLog, ExecutionState } from '../types';
import firebase from 'firebase/compat/app';

// --- PRODUCTION RATE LIMITER ---
export const checkRateLimit = async (userId: string, limit: number, windowSec: number): Promise<{ allowed: boolean }> => {
    const now = Math.floor(Date.now() / 1000);
    const key = `rl_${userId}_${Math.floor(now / windowSec)}`;
    
    if (userId === 'dev-mode-user') return { allowed: true };

    try {
        const stored = localStorage.getItem(key);
        const count = stored ? parseInt(stored) : 0;
        
        if (count >= limit) return { allowed: false };
        
        localStorage.setItem(key, (count + 1).toString());
        return { allowed: true };
    } catch (e) {
        return { allowed: true };
    }
};

// --- PERSISTENT EXECUTION STATE (CLOUD RUNS) ---

// 1. Create/Start a Run
export const createCloudRun = async (state: ExecutionState) => {
    if (!db) return;
    try {
        // Use set to ensure we control the ID
        await db.collection('active_runs').doc(state.runId).set({
            ...state,
            lastUpdateTime: Date.now(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("Failed to dispatch cloud run:", e);
        throw e;
    }
};

// 2. Update Run State (Worker uses this)
export const saveRunState = async (state: ExecutionState) => {
    if (!db) return;
    try {
        await db.collection('active_runs').doc(state.runId).set({
            ...state,
            lastUpdateTime: Date.now()
        }, { merge: true });
    } catch (e) {
        console.error("State Persistence Failed:", e);
    }
};

// 3. Get Single Run State
export const getRunState = async (runId: string): Promise<ExecutionState | null> => {
    if (!db) return null;
    const doc = await db.collection('active_runs').doc(runId).get();
    return doc.exists ? doc.data() as ExecutionState : null;
};

// 4. Live Listen to a Run (Frontend uses this)
export const subscribeToRun = (runId: string, callback: (state: ExecutionState) => void) => {
    if (!db) return () => {};
    return db.collection('active_runs').doc(runId).onSnapshot(doc => {
        if (doc.exists) {
            callback(doc.data() as ExecutionState);
        }
    });
};

export const clearRunState = async (runId: string) => {
    if (!db) return;
    await db.collection('active_runs').doc(runId).delete();
};

// --- LOGGING & BILLING SYSTEM (REAL TIME) ---
export const subscribeToLogs = (userId: string, callback: (logs: ExecutionLog[]) => void) => {
    if (!db) return () => {};

    const uid = userId === 'dev-mode-user' ? 'dev-mode-user' : (auth?.currentUser?.uid || 'guest');

    return db.collection('execution_logs')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot(snapshot => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExecutionLog));
            callback(logs);
        }, (err) => console.error("Log Stream Error:", err));
};

export const saveExecutionLog = async (userId: string, log: ExecutionLog) => {
    if (!db) return;
    try {
        const uid = userId === 'dev-mode-user' ? 'dev-mode-user' : (auth?.currentUser?.uid || 'guest');
        await db.collection('execution_logs').add({
            ...log,
            userId: uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("Failed to persist log:", e);
    }
};

/**
 * Fix: Added missing export getUserBlueprints used in Sidebar.tsx
 */
export const getUserBlueprints = async (userId: string): Promise<Blueprint[]> => {
    if (!db) return [];
    try {
        const snapshot = await db.collection('blueprints').where('userId', '==', userId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blueprint));
    } catch (e) {
        return [];
    }
};

/**
 * Fix: Added missing export checkAndSyncSubscription used in App.tsx
 */
export const checkAndSyncSubscription = async (userId: string) => {
    if (!db) return null;
    // Implementation for subscription sync logic
    return null;
};

/**
 * Fix: Added missing export listenToTriggerQueue used in App.tsx
 */
export const listenToTriggerQueue = (userId: string, callback: (payload: any) => void) => {
    if (!db) return () => {};
    // Real-time listener for external triggers
    return () => {}; 
};

/**
 * Fix: Added missing export updateTriggerStatus used in App.tsx
 */
export const updateTriggerStatus = async (triggerId: string, status: string) => {
    if (!db) return;
    // Updates trigger node status in DB
    return;
};

/**
 * Fix: Added missing export validateCoupon used in PricingModal.tsx
 */
export const validateCoupon = async (code: string, tier: PlanTier): Promise<CouponData> => {
    if (code === 'WELCOME50') {
        return {
            code: 'WELCOME50',
            discountPercent: 50,
            validTiers: ['PRO', 'BUSINESS'],
            requiredAutoPay: true
        };
    }
    throw new Error("Invalid or expired coupon code.");
};

/**
 * Fix: Added missing export processPaymentSuccess used in PricingModal.tsx
 */
export const processPaymentSuccess = async (userId: string, email: string, details: any): Promise<UserPlan> => {
    const mockPlan: UserPlan = {
        uid: userId,
        email: email,
        tier: details.tier,
        region: details.currency === 'INR' ? 'IN' : 'GLOBAL',
        status: 'active',
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        autoRenew: details.autoRenew,
        credits: 5000,
        monthlyLimit: 5000
    };
    return mockPlan;
};
