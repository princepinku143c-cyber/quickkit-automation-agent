
import { AdminPromo, ReferralStats, PlanTier, UserAccount, AdminPayment, UserRole } from '../types';

const PROMO_STORAGE_KEY = 'nexus_admin_promos';
const REFERRAL_STORAGE_KEY = 'nexus_referrals';
const USERS_STORAGE_KEY = 'nexus_admin_users';
const PAYMENTS_STORAGE_KEY = 'nexus_admin_payments';

// --- MOCK DATABASE INIT ---
const getPromos = (): AdminPromo[] => {
    try {
        const stored = localStorage.getItem(PROMO_STORAGE_KEY);
        if (!stored) {
            // Seed initial data
            const initial: AdminPromo[] = [
                { code: 'WELCOME50', type: 'PERCENT', value: 50, maxUses: 100, used: 12, validPlans: ['PRO', 'BUSINESS'], active: true, createdAt: Date.now() },
                { code: 'INDIA500', type: 'FLAT', value: 500, currency: 'INR', maxUses: 500, used: 45, validPlans: ['PRO'], active: true, createdAt: Date.now() }
            ];
            localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(stored);
    } catch { return []; }
};

const getUsers = (): UserAccount[] => {
    try {
        const stored = localStorage.getItem(USERS_STORAGE_KEY);
        if (!stored) {
            // Seed initial users
            const now = Date.now();
            const initial: UserAccount[] = [
                { uid: 'u1', email: 'owner@nexus.com', displayName: 'System Owner', role: 'OWNER', tier: 'BUSINESS', status: 'ACTIVE', joinedAt: now - 10000000, lastLoginAt: now },
                { uid: 'u2', email: 'alex.dev@gmail.com', displayName: 'Alex Dev', role: 'USER', tier: 'PRO', status: 'ACTIVE', joinedAt: now - 8000000, lastLoginAt: now - 100000 },
                { uid: 'u3', email: 'sarah.corp@company.com', displayName: 'Sarah Corp', role: 'ADMIN', tier: 'BUSINESS', status: 'ACTIVE', joinedAt: now - 5000000, lastLoginAt: now - 5000 },
                { uid: 'u4', email: 'guest123@temp.com', displayName: 'Guest User', role: 'USER', tier: 'FREE', status: 'DISABLED', joinedAt: now - 200000, lastLoginAt: now - 200000 }
            ];
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(stored);
    } catch { return []; }
};

const getPayments = (): AdminPayment[] => {
    try {
        const stored = localStorage.getItem(PAYMENTS_STORAGE_KEY);
        if (!stored) {
            const now = Date.now();
            const initial: AdminPayment[] = [
                { id: 'pay_123', userId: 'u2', userEmail: 'alex.dev@gmail.com', amount: 49, currency: 'USD', status: 'SUCCESS', gateway: 'STRIPE', date: now - 100000 },
                { id: 'pay_124', userId: 'u3', userEmail: 'sarah.corp@company.com', amount: 99, currency: 'USD', status: 'SUCCESS', gateway: 'PAYPAL', date: now - 5000000 },
                { id: 'pay_125', userId: 'u4', userEmail: 'guest123@temp.com', amount: 2499, currency: 'INR', status: 'FAILED', gateway: 'RAZORPAY', date: now - 200000 }
            ];
            localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(stored);
    } catch { return []; }
};

const getReferrals = (): Record<string, ReferralStats> => {
    try {
        return JSON.parse(localStorage.getItem(REFERRAL_STORAGE_KEY) || '{}');
    } catch { return {}; }
};

// --- USER MANAGEMENT ACTIONS ---

export const listUsers = async (): Promise<UserAccount[]> => {
    return getUsers().sort((a, b) => b.joinedAt - a.joinedAt);
};

export const updateUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
    const users = getUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
        // Prevent demoting last owner (simplified logic)
        if (users[idx].role === 'OWNER' && newRole !== 'OWNER') {
            const ownerCount = users.filter(u => u.role === 'OWNER').length;
            if (ownerCount <= 1) throw new Error("Cannot demote the last owner.");
        }
        users[idx].role = newRole;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
};

export const updateUserTier = async (uid: string, newTier: PlanTier): Promise<void> => {
    const users = getUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
        users[idx].tier = newTier;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
};

export const toggleUserStatus = async (uid: string): Promise<void> => {
    const users = getUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
        if (users[idx].role === 'OWNER') throw new Error("Cannot disable an Owner.");
        users[idx].status = users[idx].status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
};

// --- PAYMENT ACTIONS ---

export const listPayments = async (): Promise<AdminPayment[]> => {
    return getPayments().sort((a, b) => b.date - a.date);
};

// --- PROMO ACTIONS ---

export const listPromos = async (): Promise<AdminPromo[]> => {
    return getPromos().sort((a, b) => b.createdAt - a.createdAt);
};

export const createPromo = async (promo: Partial<AdminPromo>): Promise<void> => {
    if (!promo.code || !promo.type || !promo.value) throw new Error("Missing required fields");
    
    const promos = getPromos();
    if (promos.find(p => p.code === promo.code)) throw new Error("Promo code already exists");

    const newPromo: AdminPromo = {
        code: promo.code.toUpperCase(),
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

    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify([...promos, newPromo]));
};

export const togglePromo = async (code: string): Promise<void> => {
    const promos = getPromos();
    const idx = promos.findIndex(p => p.code === code);
    if (idx >= 0) {
        promos[idx].active = !promos[idx].active;
        localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promos));
    }
};

export const deletePromo = async (code: string): Promise<void> => {
    const promos = getPromos().filter(p => p.code !== code);
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promos));
};

// --- REFERRAL ACTIONS ---

export const getUserReferral = async (userId: string, email: string): Promise<ReferralStats> => {
    const refs = getReferrals();
    
    if (refs[userId]) return refs[userId];

    // Create new referral code if not exists
    const code = (email.split('@')[0] + Math.floor(Math.random() * 1000)).toUpperCase().substring(0, 8);
    const newRef: ReferralStats = {
        userId,
        code,
        totalInvites: 0,
        earnedCredits: 0,
        pendingRewards: 0
    };
    
    refs[userId] = newRef;
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(refs));
    return newRef;
};

export const trackReferralUse = async (refCode: string): Promise<boolean> => {
    const refs = getReferrals();
    const referrerId = Object.keys(refs).find(uid => refs[uid].code === refCode);
    
    if (referrerId) {
        refs[referrerId].totalInvites += 1;
        refs[referrerId].earnedCredits += 10; // +10 AI Credits per invite
        localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(refs));
        return true;
    }
    return false;
};
