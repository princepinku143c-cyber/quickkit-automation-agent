
import { db } from './firebase';
import { AdminPromo, ReferralStats, PlanTier, UserAccount, AdminPayment, UserRole } from '../types';
import firebase from 'firebase/compat/app';

// --- LIVE FIRESTORE ADMIN ACTIONS ---

export const listUsers = async (): Promise<UserAccount[]> => {
    if (!db) return [];
    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').limit(50).get();
        return snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                uid: doc.id,
                email: d.email,
                displayName: d.displayName || d.email?.split('@')[0] || 'User',
                role: d.role || 'USER',
                tier: d.plan?.tier || d.tier || 'FREE',
                status: d.status || 'ACTIVE',
                joinedAt: d.createdAt?.toMillis() || Date.now(),
                lastLoginAt: d.lastLoginAt || Date.now(),
                usage: d.usage || { workflows: 0, runs: 0, apiCalls: 0 } // Fetch Usage
            };
        });
    } catch (e) {
        console.error("Admin List Users Failed:", e);
        return [];
    }
};

export const updateUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
    if (!db) return;
    await db.collection('users').doc(uid).update({ role: newRole });
};

export const updateUserTier = async (uid: string, newTier: PlanTier): Promise<void> => {
    if (!db) return;
    // Also update credits based on tier change
    const credits = newTier === 'PRO' ? 5000 : newTier === 'BUSINESS' ? 20000 : 5;
    await db.collection('users').doc(uid).update({ 
        'plan.tier': newTier,
        'plan.credits': credits,
        tier: newTier // Legacy field sync
    });
};

export const toggleUserStatus = async (uid: string): Promise<void> => {
    if (!db) return;
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
        const current = doc.data()?.status || 'ACTIVE';
        await doc.ref.update({ status: current === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' });
    }
};

// --- PAYMENT ACTIONS ---

export const listPayments = async (): Promise<AdminPayment[]> => {
    if (!db) return [];
    try {
        const snapshot = await db.collection('payments').orderBy('createdAt', 'desc').limit(50).get();
        return snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                userId: d.userId,
                userEmail: 'Fetched on Demand', 
                amount: d.amount,
                currency: d.currency,
                status: d.status.toUpperCase(),
                gateway: d.gateway,
                date: d.createdAt?.toMillis() || Date.now()
            };
        });
    } catch (e) { return []; }
};

// --- PROMO ACTIONS (REAL DB) ---

export const listPromos = async (): Promise<AdminPromo[]> => {
    if (!db) return [];
    try {
        const snapshot = await db.collection('coupons').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => doc.data() as AdminPromo);
    } catch (e) { return []; }
};

export const createPromo = async (promo: Partial<AdminPromo>): Promise<void> => {
    if (!db) throw new Error("DB Offline");
    if (!promo.code || !promo.type || !promo.value) throw new Error("Missing fields");
    
    const cleanCode = promo.code.toUpperCase().trim();
    
    // Check Existence
    const existing = await db.collection('coupons').where('code', '==', cleanCode).get();
    if (!existing.empty) throw new Error("Promo code already exists");

    const newPromo: AdminPromo = {
        code: cleanCode,
        type: promo.type,
        value: promo.value,
        currency: promo.currency,
        maxUses: promo.maxUses || 100,
        used: 0,
        expiresAt: promo.expiresAt,
        validPlans: promo.validPlans || ['PRO', 'BUSINESS'],
        active: true,
        createdAt: Date.now()
    };

    await db.collection('coupons').add(newPromo);
};

export const togglePromo = async (code: string): Promise<void> => {
    if (!db) return;
    const snapshot = await db.collection('coupons').where('code', '==', code).get();
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        await doc.ref.update({ active: !doc.data().active });
    }
};

export const deletePromo = async (code: string): Promise<void> => {
    if (!db) return;
    const snapshot = await db.collection('coupons').where('code', '==', code).get();
    snapshot.forEach(doc => doc.ref.delete());
};

// --- REFERRAL ACTIONS ---

export const getUserReferral = async (userId: string, email: string): Promise<ReferralStats> => {
    if (!db) return { userId, code: 'OFFLINE', totalInvites: 0, earnedCredits: 0, pendingRewards: 0 };
    
    const docRef = db.collection('referrals').doc(userId);
    const doc = await docRef.get();

    if (doc.exists) return doc.data() as ReferralStats;

    // Create new
    const code = (email.split('@')[0] + Math.floor(Math.random() * 1000)).toUpperCase().substring(0, 8);
    const newRef: ReferralStats = {
        userId,
        code,
        totalInvites: 0,
        earnedCredits: 0,
        pendingRewards: 0
    };
    
    await docRef.set(newRef);
    return newRef;
};

/**
 * Helper to check if a user has admin privileges
 */
export const isAdmin = (userPlan: any): boolean => {
    if (!userPlan) return false;
    return userPlan.role === 'ADMIN' || userPlan.role === 'OWNER';
};
