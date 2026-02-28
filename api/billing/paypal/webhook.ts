import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Buffer } from 'buffer';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const NODE_ENV = process.env.NODE_ENV || 'development';
const PAYPAL_API = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const LOG_PREFIX = '[PAYPAL_WEBHOOK]';

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
  if (!privateKey) {
    console.warn(`${LOG_PREFIX} Missing FIREBASE_PRIVATE_KEY.`);
    return false;
  }

  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      })
    });
    return true;
  } catch (e) {
    console.error(`${LOG_PREFIX} Firebase init failed:`, e);
    return false;
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const getAccessToken = async (): Promise<string> => {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || 'Auth failed');
  return data.access_token;
};

const getHeader = (req: any, key: string) => {
  const keys = Object.keys(req.headers);
  const match = keys.find(k => k.toLowerCase() === key.toLowerCase());
  return match ? req.headers[match] : null;
};


const verifySignature = async (req: any, body: any): Promise<boolean> => {
  if (!PAYPAL_WEBHOOK_ID) {
    console.error(`${LOG_PREFIX} PAYPAL_WEBHOOK_ID missing. Signature verification is mandatory.`);
    return false;
  }

  const transmissionId = getHeader(req, 'paypal-transmission-id');
  const transmissionTime = getHeader(req, 'paypal-transmission-time');
  const certUrl = getHeader(req, 'paypal-cert-url');
  const authAlgo = getHeader(req, 'paypal-auth-algo');
  const transmissionSig = getHeader(req, 'paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.error(`${LOG_PREFIX} Missing security headers`);
    return false;
  }

  try {
    const token = await getAccessToken();
    const response = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: body
      })
    });

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (e) {
    console.error(`${LOG_PREFIX} Verification error:`, e);
    return false;
  }
};

const fetchOrderReferenceId = async (orderId: string): Promise<string | undefined> => {
  try {
    const token = await getAccessToken();
    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orderResponse.ok) {
      const errorBody = await orderResponse.json();
      console.error(`${LOG_PREFIX} Unable to fetch order details`, errorBody);
      return undefined;
    }

    const orderBody = await orderResponse.json();
    return orderBody?.purchase_units?.[0]?.reference_id;
  } catch (error) {
    console.error(`${LOG_PREFIX} fetchOrderReferenceId failed`, error);
    return undefined;
  }
};

export default async function handler(req: any, res: any) {
  const correlationId = (req.headers['x-correlation-id'] as string) || `pp_webhook_${Date.now()}`;
  res.setHeader('x-correlation-id', correlationId);
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', time: Date.now(), firebaseReady: ensureFirebaseReady() });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const body = JSON.parse(rawBody);

    const isValid = await verifySignature(req, body);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid Signature' });
    }

    const eventType = body.event_type;
    const resource = body.resource;

    if (eventType !== 'PAYMENT.CAPTURE.COMPLETED') {
      return res.status(200).json({ received: true });
    }

    const userId = resource?.custom_id;
    const paymentId = resource?.id;
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    const amount = Number(resource?.amount?.value || 0);
    const currency = resource?.amount?.currency_code || 'USD';

    const referenceId = orderId ? await fetchOrderReferenceId(orderId) : undefined;
    const plan = parsePlanMetadata(referenceId);
    if (!plan) {
      console.error(`${LOG_PREFIX} [${correlationId}] Missing plan metadata reference_id for order`, { orderId });
      return res.status(202).json({ received: true, requiresManualReview: true });
    }

    const { tier, cycle } = plan;
    const renewalDays = cycle === 'yearly' ? 365 : 30;
    const planLimits = PLAN_CONFIG[tier];

    if (!userId || !paymentId) {
      console.error(`${LOG_PREFIX} [${correlationId}] Missing userId or paymentId`, { userId, paymentId });
      return res.status(400).json({ error: 'Missing payment metadata' });
    }

    if (!ensureFirebaseReady()) {
      return res.status(500).json({ error: 'Firebase not configured' });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const paymentRef = db.collection('payments').doc(paymentId);

    await db.runTransaction(async (t) => {
      const paymentDoc = await t.get(paymentRef);
      if (paymentDoc.exists) {
        console.log(`${LOG_PREFIX} [${correlationId}] Payment ${paymentId} already processed. Skipping.`);
        return;
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

      t.set(paymentRef, {
        userId,
        eventId: body.id,
        orderId,
        amount,
        currency,
        status: 'success',
        gateway: 'PAYPAL',
        tier,
        cycle,
        createdAt: FieldValue.serverTimestamp(),
        rawEventType: eventType
      });
    });

    console.log(`${LOG_PREFIX} [${correlationId}] Successfully upgraded ${userId}`);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error(`${LOG_PREFIX} [${correlationId}] Error:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
