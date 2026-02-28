import { Buffer } from 'buffer';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const LOG_PREFIX = '[PAYPAL_CAPTURE]';

type PlanTier = 'PRO' | 'BUSINESS';
type BillingCycle = 'monthly' | 'yearly';

const PLAN_CONFIG: Record<PlanTier, { monthlyLimit: number; credits: number }> = {
  PRO: { monthlyLimit: 5000, credits: 5000 },
  BUSINESS: { monthlyLimit: 20000, credits: 20000 },
};

const parsePlanMetadata = (referenceId?: string): { tier: PlanTier; cycle: BillingCycle } | null => {
  if (!referenceId) return null;

  const [tierRaw, cycleRaw] = referenceId.split(':');
  const tier = tierRaw === 'BUSINESS' ? 'BUSINESS' : 'PRO';
  const cycle = cycleRaw === 'yearly' ? 'yearly' : 'monthly';
  return { tier, cycle };
};

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

const getAccessToken = async (): Promise<string> => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are missing.');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenData.error_description || 'PayPal authentication failed.');
  }

  return tokenData.access_token;
};

export default async function handler(req: any, res: any) {
  const correlationId = (req.headers['x-correlation-id'] as string) || `pp_capture_${Date.now()}`;
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderToken } = req.body || {};
    if (!orderToken) {
      return res.status(400).json({ error: 'Missing orderToken' });
    }

    const token = await getAccessToken();

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderToken}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      console.error(`${LOG_PREFIX} [${correlationId}] Capture failed`, captureData);
      return res.status(400).json({ error: captureData.message || 'Unable to capture PayPal order.' });
    }

    const purchaseUnit = captureData.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    const userId = purchaseUnit?.custom_id;
    const paymentId = capture?.id;

    if (!userId || !paymentId) {
      console.error(`${LOG_PREFIX} [${correlationId}] Missing userId/paymentId`, { userId, paymentId });
      return res.status(400).json({ error: 'Capture response missing account details.' });
    }

    if (!ensureFirebaseReady()) {
      console.error(`${LOG_PREFIX} [${correlationId}] Firebase admin is not configured.`);
      return res.status(500).json({ error: 'Server payment persistence is not configured.' });
    }

    const amount = Number(capture.amount?.value || 0);
    const currency = capture.amount?.currency_code || 'USD';
    const plan = parsePlanMetadata(purchaseUnit?.reference_id);

    if (!plan) {
      console.error(`${LOG_PREFIX} [${correlationId}] Missing reference_id metadata`, { orderToken, amount, currency });
      return res.status(400).json({ error: 'Missing billing metadata. Please contact support with order details.' });
    }

    const { tier, cycle } = plan;
    const renewalDays = cycle === 'yearly' ? 365 : 30;
    const planLimits = PLAN_CONFIG[tier];
    const db = getFirestore();

    const userRef = db.collection('users').doc(userId);
    const paymentRef = db.collection('payments').doc(paymentId);

    await db.runTransaction(async (t) => {
      const existing = await t.get(paymentRef);
      if (!existing.exists) {
        t.set(paymentRef, {
          userId,
          orderId: captureData.id,
          amount,
          currency,
          status: 'success',
          gateway: 'PAYPAL',
          source: 'capture_api',
          tier,
          cycle,
          createdAt: FieldValue.serverTimestamp()
        });
      }

      t.set(userRef, {
        tier,
        status: 'active',
        credits: planLimits.credits,
        monthlyLimit: planLimits.monthlyLimit,
        renewalDate: Timestamp.fromMillis(Date.now() + renewalDays * 24 * 60 * 60 * 1000),
        updatedAt: FieldValue.serverTimestamp(),
        autoRenew: true,
        plan: {
          tier,
          cycle,
          status: 'active',
          provider: 'PAYPAL',
          credits: planLimits.credits,
          monthlyLimit: planLimits.monthlyLimit,
          expiresAt: Date.now() + renewalDays * 24 * 60 * 60 * 1000,
          lastPaymentId: paymentId
        }
      }, { merge: true });
    });

    return res.status(200).json({ success: true, paymentId, message: 'Payment confirmed.' });
  } catch (error: any) {
    console.error(`${LOG_PREFIX} [${correlationId}] Error`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
