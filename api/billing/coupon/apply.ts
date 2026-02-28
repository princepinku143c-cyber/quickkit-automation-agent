import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { validateCoupon } from '../../../lib/serverUtils';

const ensureFirebaseReady = () => {
  if (getApps().length > 0) return true;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) return false;

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    })
  });

  return true;
};

const PLAN_CONFIG: Record<string, { monthlyLimit: number; credits: number }> = {
  PRO: { monthlyLimit: 5000, credits: 5000 },
  BUSINESS: { monthlyLimit: 20000, credits: 20000 },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, coupon, tier, cycle, currency } = req.body || {};

    if (!userId || !coupon || !tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!ensureFirebaseReady()) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 1. Validate Coupon
    const promo = await validateCoupon(coupon, tier, currency || 'USD');
    if (!promo) {
      return res.status(400).json({ error: 'Invalid or expired coupon' });
    }

    // 2. Check if it's a 100% discount
    if (promo.type !== 'PERCENT' || promo.value !== 100) {
      return res.status(400).json({ error: 'This coupon does not provide a 100% discount' });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const planLimits = PLAN_CONFIG[tier as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.PRO;
    const renewalDays = cycle === 'yearly' ? 365 : 30;

    // 3. Upgrade User
    await userRef.update({
      tier,
      status: 'active',
      credits: planLimits.credits,
      monthlyLimit: planLimits.monthlyLimit,
      renewalDate: Timestamp.fromMillis(Date.now() + renewalDays * 24 * 60 * 60 * 1000),
      updatedAt: FieldValue.serverTimestamp(),
      autoRenew: true,
      plan: {
        tier,
        cycle: cycle || 'monthly',
        status: 'active',
        provider: 'COUPON',
        credits: planLimits.credits,
        monthlyLimit: planLimits.monthlyLimit,
        expiresAt: Date.now() + renewalDays * 24 * 60 * 60 * 1000,
        lastPaymentId: `FREE_${coupon}_${Date.now()}`
      }
    });

    // 4. Log the usage (Optional: Create a payment record)
    const paymentId = `FREE_${coupon}_${Date.now()}`;
    await db.collection('payments').doc(paymentId).set({
      userId,
      amount: 0,
      currency: currency || 'USD',
      status: 'success',
      gateway: 'COUPON',
      tier,
      cycle: cycle || 'monthly',
      coupon,
      createdAt: FieldValue.serverTimestamp()
    });

    return res.status(200).json({ success: true, message: 'Plan upgraded successfully via coupon.' });
  } catch (error: any) {
    console.error('[COUPON_APPLY] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
