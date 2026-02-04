
import { db, auth } from './firebase';
import { Blueprint, UserPlan, PlanTier, CouponData, ExecutionLog, ExecutionState, Nexus, Synapse, Region, AdminPromo } from '../types';
import firebase from 'firebase/compat/app';
import { listPromos } from './adminService'; // New import

// --- ARCHITECT MEMORY SYSTEM (Self-Improvement) ---

export interface ArchitectMemory {
    id?: string;
    userPrompt: string;
    blueprintSummary: string; // Brief description of what was built
    fullBlueprint: { nexuses: Nexus[], synapses: Synapse[] };
    createdAt: number;
    likes?: number;
}

export const saveArchitectMemory = async (prompt: string, nexuses: Nexus[], synapses: Synapse[]) => {
    if (!db) return;
    
    // Only save complex workflows (more than 2 nodes) to keep quality high
    if (nexuses.length < 3) return;

    try {
        const memory: ArchitectMemory = {
            userPrompt: prompt,
            blueprintSummary: `Workflow with ${nexuses.length} nodes: ${nexuses.map(n => n.subtype).join(', ')}`,
            fullBlueprint: { nexuses, synapses },
            createdAt: Date.now(),
            likes: 1
        };

        await db.collection('architect_memory').add(memory);
        console.log("[Architect] Memory saved for training.");
    } catch (e) {
        console.warn("Failed to save memory:", e);
    }
};

export const getArchitectMemories = async (limit: number = 5): Promise<string> => {
    if (!db) return "";

    try {
        // Fetch recent successful workflows to use as "Few-Shot Examples"
        const snapshot = await db.collection('architect_memory')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        if (snapshot.empty) return "";

        let contextString = "\n### LEARNED PATTERNS FROM PREVIOUS USERS (USE AS REFERENCE):\n";
        
        snapshot.forEach(doc => {
            const data = doc.data() as ArchitectMemory;
            contextString += `- USER ASKED: "${data.userPrompt}"\n`;
            contextString += `  SUCCESSFUL ARCHITECTURE: ${data.blueprintSummary}\n`;
        });

        return contextString;
    } catch (e) {
        return "";
    }
};

// --- FUEL TANK: DAILY USAGE & QUOTA SENTRY ---
export const updateDailyUsage = async (userId: string): Promise<{ allowed: boolean, count: number }> => {
    if (!db || userId === 'guest') return { allowed: true, count: 0 };

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const quotaRef = db.collection('usage_quotas').doc(`${userId}_${today}`);

    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(quotaRef);
            
            // Default Limits (Plan-based would go here)
            const dailyLimit = 25; 
            
            if (!doc.exists) {
                transaction.set(quotaRef, { count: 1, lastUpdate: Date.now() });
                return { allowed: true, count: 1 };
            }

            const data = doc.data();
            const newCount = (data?.count || 0) + 1;

            if (newCount > dailyLimit) {
                return { allowed: false, count: data?.count || 0 };
            }

            transaction.update(quotaRef, { count: newCount, lastUpdate: Date.now() });
            return { allowed: true, count: newCount };
        });
    } catch (e) {
        console.error("Quota Check Failed:", e);
        return { allowed: true, count: 0 }; // Fail open for UX, but log error
    }
};

export const checkRateLimit = async (userId: string, limit: number, windowSec: number): Promise<{ allowed: boolean }> => {
    const now = Math.floor(Date.now() / 1000);
    const key = `rl_${userId}_${Math.floor(now / windowSec)}`;
    try {
        const stored = localStorage.getItem(key);
        const count = stored ? parseInt(stored) : 0;
        if (count >= limit) return { allowed: false };
        localStorage.setItem(key, (count + 1).toString());
        return { allowed: true };
    } catch (e) { return { allowed: true }; }
};

export const createCloudRun = async (state: ExecutionState) => {
    if (!db) return;
    await db.collection('active_runs').doc(state.runId).set({
        ...state,
        lastUpdateTime: Date.now(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const saveRunState = async (state: ExecutionState) => {
    if (!db) return;
    await db.collection('active_runs').doc(state.runId).set({ ...state, lastUpdateTime: Date.now() }, { merge: true });
};

export const clearRunState = async (runId: string) => {
    if (!db) return;
    await db.collection('active_runs').doc(runId).delete();
};

/**
 * Fix: Added subscribeToRun to monitor execution state changes in Firestore.
 */
export const subscribeToRun = (runId: string, callback: (state: ExecutionState) => void) => {
    if (!db) return () => {};
    return db.collection('active_runs').doc(runId).onSnapshot(doc => {
        if (doc.exists) {
            callback(doc.data() as ExecutionState);
        }
    });
};

export const saveExecutionLog = async (userId: string, log: ExecutionLog) => {
    if (!db) return;
    // LOGGING SENTRY: Only log minimal data in production to save costs
    const minimalLog = {
        id: log.id,
        timestamp: log.timestamp,
        nexusId: log.nexusId,
        status: log.status,
        duration: log.duration,
        userId: userId || 'guest'
    };
    await db.collection('execution_logs').add({ ...minimalLog, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
};

export const subscribeToLogs = (userId: string, callback: (logs: ExecutionLog[]) => void) => {
    if (!db) return () => {};
    const uid = userId === 'dev-mode-user' ? 'dev-mode-user' : (auth?.currentUser?.uid || 'guest');
    return db.collection('execution_logs').where('userId', '==', uid).orderBy('timestamp', 'desc').limit(20).onSnapshot(snapshot => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExecutionLog));
        callback(logs);
    });
};

export const getUserBlueprints = async (userId: string): Promise<Blueprint[]> => {
    if (!db) return [];
    const snapshot = await db.collection('blueprints').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blueprint));
};

// --- DYNAMIC COUPON VALIDATION ---
export const validateCoupon = async (code: string, tier: PlanTier, region: Region): Promise<CouponData> => {
    const cleanCode = code.toUpperCase().trim();
    
    // 1. Fetch from Admin Service (Simulated Backend)
    const allPromos = await listPromos();
    const promo = allPromos.find(p => p.code === cleanCode);

    if (!promo) throw new Error("Invalid promo code.");
    if (!promo.active) throw new Error("This promo code has been disabled.");
    if (promo.used >= promo.maxUses) throw new Error("Promo code limit reached.");
    if (promo.expiresAt && Date.now() > promo.expiresAt) throw new Error("Promo code expired.");
    
    // Check Tier
    if (!promo.validPlans.includes(tier)) {
        throw new Error(`This code is only valid for ${promo.validPlans.join('/')} plans.`);
    }

    // Check Region / Currency Mismatch
    if (promo.currency) {
        if (region === 'IN' && promo.currency !== 'INR') throw new Error("This code cannot be used in India.");
        if (region === 'GLOBAL' && promo.currency !== 'USD') throw new Error("This code is for India region only.");
    }

    // Return Normalized Data
    return { 
        code: cleanCode, 
        discountType: promo.type, 
        discountValue: promo.value,
        validTiers: promo.validPlans,
        requiredAutoPay: true 
    };
};

export const processPaymentSuccess = async (userId: string, email: string, details: any): Promise<UserPlan> => {
    return { 
        uid: userId, 
        email: email, 
        tier: details.tier, 
        region: details.currency === 'INR' ? 'IN' : 'GLOBAL', 
        status: 'active', 
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, 
        updatedAt: Date.now(), 
        autoRenew: details.autoRenew, 
        credits: 5000, 
        monthlyLimit: 5000,
        role: 'USER'
    };
};
