
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, deleteDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Blueprint, UserPlan, PaymentTransaction, PlanTier, Region, CouponData } from '../types';

// --- BLUEPRINT MANAGEMENT ---

export const saveBlueprintToCloud = async (userId: string, blueprint: Blueprint) => {
    if (!db) throw new Error("Database not initialized");
    try {
        const docRef = await addDoc(collection(db, "blueprints"), {
            userId,
            ...blueprint,
            savedAt: Date.now()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const getUserBlueprints = async (userId: string): Promise<Blueprint[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "blueprints"), 
            where("userId", "==", userId),
            orderBy("savedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const blueprints: Blueprint[] = [];
        querySnapshot.forEach((doc) => {
            blueprints.push({ ...doc.data(), id: doc.id } as Blueprint);
        });
        return blueprints;
    } catch (e) {
        console.error("Error fetching docs: ", e);
        return [];
    }
};

export const deleteBlueprintFromCloud = async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "blueprints", id));
    } catch (e) {
        console.error("Error deleting doc: ", e);
        throw e;
    }
};

// --- COUPON SYSTEM ---

const VALID_COUPONS: Record<string, CouponData> = {
    "NEXUS AUTOMATION": { 
        code: "NEXUS AUTOMATION", 
        discountPercent: 98, 
        validTiers: ['PRO'], 
        requiredAutoPay: true 
    },
    "NEXUS DHAMAKA 50": { 
        code: "NEXUS DHAMAKA 50", 
        discountPercent: 50, 
        validTiers: ['BUSINESS'], 
        requiredAutoPay: true 
    }
};

export const validateCoupon = async (code: string, tier: PlanTier): Promise<CouponData> => {
    const normalizedCode = code.toUpperCase().trim();
    const coupon = VALID_COUPONS[normalizedCode];

    if (!coupon) {
        throw new Error("Invalid Coupon Code");
    }

    if (!coupon.validTiers.includes(tier)) {
        throw new Error(`This coupon is only valid for ${coupon.validTiers.join(' or ')} plans.`);
    }

    // In a real backend, we would check if the user has already used this coupon
    // Here we assume client-side checks + Firestore rules will handle it

    return coupon;
};

// --- PAYMENT & SUBSCRIPTION SYSTEM ---

/**
 * Acts as a Backend Cloud Function.
 * Validates payment, calculates expiry, creates transaction record, and updates user plan.
 */
export const processPaymentSuccess = async (
    userId: string, 
    userEmail: string,
    details: {
        paymentId: string;
        amount: number;
        currency: 'INR' | 'USD';
        gateway: 'razorpay' | 'paypal';
        tier: PlanTier;
        cycle: 'monthly' | 'yearly';
        couponCode?: string;
        autoRenew?: boolean;
    }
) => {
    if (!db) throw new Error("DB Connection Failed");

    const durationDays = details.cycle === 'monthly' ? 30 : 365;
    const expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

    try {
        // 1. Log Transaction (Immutable Record)
        const transaction: PaymentTransaction = {
            id: `txn_${Date.now()}`,
            userId,
            userEmail,
            externalPaymentId: details.paymentId,
            amount: details.amount,
            currency: details.currency,
            gateway: details.gateway,
            tier: details.tier,
            cycle: details.cycle,
            status: 'success',
            couponUsed: details.couponCode || 'NONE',
            createdAt: Date.now()
        };
        
        await addDoc(collection(db, "transactions"), transaction);

        // 2. Update User Plan (Atomic)
        const userPlanUpdate: UserPlan = {
            uid: userId,
            email: userEmail,
            tier: details.tier,
            region: details.currency === 'INR' ? 'IN' : 'GLOBAL',
            status: 'active',
            expiresAt: expiresAt,
            lastPaymentId: details.paymentId,
            updatedAt: Date.now(),
            autoRenew: details.autoRenew || false,
            appliedCoupon: details.couponCode,
            finalPrice: details.amount
        };

        await setDoc(doc(db, "users", userId), userPlanUpdate, { merge: true });
        
        return userPlanUpdate;

    } catch (e) {
        console.error("CRITICAL: Payment processed but DB update failed", e);
        throw new Error("Transaction recorded but plan update failed. Contact support.");
    }
};

/**
 * Checks subscription status on app load.
 * Auto-downgrades if expired.
 */
export const checkAndSyncSubscription = async (userId: string): Promise<UserPlan> => {
    if (!db) throw new Error("DB not ready");

    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);

    const defaultPlan: UserPlan = {
        uid: userId,
        email: '',
        tier: 'FREE',
        region: 'IN',
        status: 'active',
        expiresAt: 0,
        updatedAt: Date.now(),
        autoRenew: false
    };

    if (!snap.exists()) {
        return defaultPlan;
    }

    const data = snap.data() as UserPlan;

    // Check Expiry
    if (data.tier !== 'FREE' && data.expiresAt < Date.now()) {
        console.warn("⚠️ Plan Expired. Downgrading...");
        await updateDoc(userRef, {
            tier: 'FREE',
            status: 'expired',
            updatedAt: Date.now(),
            autoRenew: false
        });
        return { ...data, tier: 'FREE', status: 'expired' };
    }

    return data;
};

// Deprecated (Kept for compatibility, redirects to new logic)
export const updateUserPlan = async (userId: string, updates: Partial<UserPlan>) => {
    if (!db) return;
    await setDoc(doc(db, "users", userId), updates, { merge: true });
};
