
import { db } from './firebase';
import { AdminPromo, PlanTier } from '../types';

export class CouponService {
    /**
     * Validates a coupon code against Firestore
     */
    public static async validate(code: string, tier: PlanTier, currency: 'USD' | 'INR'): Promise<AdminPromo> {
        const cleanCode = code.toUpperCase().trim();

        // 🔥 TEMPORARY TEST PROMO: 100% OFF
        if (cleanCode === 'PRINCEPINKU143') {
            return {
                code: 'PRINCEPINKU143',
                type: 'PERCENT',
                value: 100,
                active: true,
                used: 0,
                maxUses: 9999,
                validPlans: ['PRO', 'BUSINESS'],
                currency: currency,
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                createdAt: Date.now()
            };
        }

        if (!db) throw new Error("Database Offline");
        const snapshot = await db.collection('coupons')
            .where('code', '==', cleanCode)
            .where('active', '==', true)
            .get();

        if (snapshot.empty) {
            throw new Error("Invalid or expired coupon code.");
        }

        const promo = snapshot.docs[0].data() as AdminPromo;

        // 1. Check Expiry
        if (promo.expiresAt && promo.expiresAt < Date.now()) {
            throw new Error("This coupon has expired.");
        }

        // 2. Check Usage Limit
        if (promo.used >= promo.maxUses) {
            throw new Error("This coupon has reached its usage limit.");
        }

        // 3. Check Plan Compatibility
        if (!promo.validPlans.includes(tier)) {
            throw new Error(`This coupon is not valid for the ${tier} plan.`);
        }

        // 4. Check Currency Compatibility (if specified)
        if (promo.currency && promo.currency !== currency) {
            throw new Error(`This coupon is only valid for ${promo.currency} payments.`);
        }

        return promo;
    }

    /**
     * Calculates the discounted price
     */
    public static calculateDiscount(originalPrice: number, promo: AdminPromo): number {
        if (promo.type === 'PERCENT') {
            const discount = (originalPrice * promo.value) / 100;
            return Math.max(0, originalPrice - discount);
        } else {
            return Math.max(0, originalPrice - promo.value);
        }
    }
}
