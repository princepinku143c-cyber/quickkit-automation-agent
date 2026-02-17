import * as admin from 'firebase-admin';
import { Buffer } from 'buffer';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const NODE_ENV = process.env.NODE_ENV || 'development';
const PAYPAL_API = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        })
      });
      console.log('🔥 Firebase Admin Initialized');
    } else {
      console.warn('⚠️ FIREBASE_PRIVATE_KEY is missing. Database operations will fail.');
    }
  } catch (e) {
    console.error('🔥 Firebase Init Failed:', e);
  }
}

const db = admin.firestore();

export const config = {
  api: {
    bodyParser: false,
  },
};

const getAccessToken = async (): Promise<string> => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials missing.');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenData.error_description || 'PayPal token request failed');
  }

  return tokenData.access_token;
};

const verifyWebhookSignature = async (req: any, rawBody: string): Promise<boolean> => {
  if (!PAYPAL_WEBHOOK_ID) {
    if (NODE_ENV === 'production') {
      throw new Error('PAYPAL_WEBHOOK_ID missing in production.');
    }
    console.warn('⚠️ PAYPAL_WEBHOOK_ID not set, skipping signature verification in non-production environment.');
    return true;
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: req.headers['paypal-auth-algo'],
      cert_url: req.headers['paypal-cert-url'],
      transmission_id: req.headers['paypal-transmission-id'],
      transmission_sig: req.headers['paypal-transmission-sig'],
      transmission_time: req.headers['paypal-transmission-time'],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || 'Webhook signature verify failed');
  }

  return data.verification_status === 'SUCCESS';
};

const resolveUid = async (resource: any, eventType: string): Promise<string | null> => {
  if (resource?.custom_id) return resource.custom_id;

  if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    if (!orderId) return null;

    const accessToken = await getAccessToken();
    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      throw new Error(orderData.message || 'Failed fetching PayPal order');
    }

    return orderData?.purchase_units?.[0]?.custom_id || null;
  }

  return null;
};

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, status: 'PayPal Webhook Live' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const buffers: any[] = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString('utf8');
    const body = JSON.parse(rawBody);

    const valid = await verifyWebhookSignature(req, rawBody);
    if (!valid) {
      console.error('❌ Invalid PayPal webhook signature.');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const eventType = body.event_type;
    const resource = body.resource || {};

    console.log(`🔔 PayPal Event: ${eventType} | ID: ${resource?.id || body?.id}`);

    // Upgrade only on terminal/confirmed events to avoid premature plan activation.
    if (
      eventType === 'PAYMENT.CAPTURE.COMPLETED' ||
      eventType === 'BILLING.SUBSCRIPTION.ACTIVATED'
    ) {
      const uid = await resolveUid(resource, eventType);

      if (!uid) {
        console.warn(`⚠️ PayPal event ${eventType} missing uid/custom_id. Resource ID: ${resource?.id || 'N/A'}`);
        return res.status(200).json({ received: true, skipped: 'missing_uid' });
      }

      const paymentId = resource.id || body.id;
      const amount = Number(resource.amount?.value || resource.amount?.total || 0);
      const currency = resource.amount?.currency_code || resource.amount?.currency || 'USD';

      if (paymentId) {
        const existingPayment = await db.collection('payments').doc(paymentId).get();
        if (existingPayment.exists && existingPayment.data()?.status === 'success') {
          console.log(`ℹ️ PayPal event already processed for payment ${paymentId}.`);
          return res.status(200).json({ received: true, duplicate: true });
        }
      }

      await db.collection('users').doc(uid).set({
        plan: {
          tier: 'PRO',
          status: 'active',
          provider: 'PAYPAL',
          credits: 5000,
          monthlyLimit: 5000,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          autoRenew: true,
        },
        tier: 'PRO',
        status: 'active',
        provider: 'PAYPAL',
        credits: 5000,
        monthlyLimit: 5000,
        autoRenew: true,
        lastPaymentId: paymentId,
        updatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      }, { merge: true });

      if (paymentId) {
        await db.collection('payments').doc(paymentId).set({
          id: paymentId,
          userId: uid,
          gateway: 'PAYPAL',
          amount,
          currency,
          status: 'success',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          rawEventType: eventType,
        }, { merge: true });
      }

      console.log(`✅ PayPal: upgraded user ${uid} via ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('🔥 PayPal Webhook Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Error' });
  }
}
