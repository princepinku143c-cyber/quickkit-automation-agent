
import * as admin from 'firebase-admin';
import { Buffer } from 'buffer';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const NODE_ENV = process.env.NODE_ENV || 'development';
const PAYPAL_API = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const LOG_PREFIX = '[PAYPAL_WEBHOOK]';

let isFirebaseReady = false;

if (!admin.apps?.length) {  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        })
      });
      isFirebaseReady = true;
      console.log(`${LOG_PREFIX} Firebase Admin initialized.`);
    } else {
      console.warn(`${LOG_PREFIX} FIREBASE_PRIVATE_KEY missing. Database operations unavailable.`);
    }
  } catch (e) {
    console.error(`${LOG_PREFIX} Firebase init failed:`, e);
  }
} else {
  isFirebaseReady = true;
}

const getDb = () => {
  if (!isFirebaseReady) return null;
  try {
    return admin.firestore();
  } catch {
    return null;
  }
};

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

const verifyWebhookSignature = async (req: any, webhookEvent: any): Promise<boolean> => {
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
      webhook_event: webhookEvent,
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
    return res.status(200).json({ ok: true, status: 'PayPal Webhook Live', firebaseReady: !!getDb(), env: process.env.PAYPAL_ENV || 'sandbox' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Billing store unavailable' });
    }

    const buffers: any[] = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString('utf8');
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    const requiredHeaders = [
      'paypal-auth-algo',
      'paypal-cert-url',
      'paypal-transmission-id',
      'paypal-transmission-sig',
      'paypal-transmission-time',
    ];

    const missingHeader = requiredHeaders.find((header) => !req.headers?.[header]);
    if (missingHeader) {
      return res.status(400).json({ error: `Missing PayPal signature header: ${missingHeader}` });
    }

    if (!body?.event_type) {
      return res.status(400).json({ error: 'Missing event_type' });
    }

    const valid = await verifyWebhookSignature(req, body);
    if (!valid) {
      console.error(`${LOG_PREFIX} Invalid webhook signature.`);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const eventType = body.event_type;
    const resource = body.resource || {};

    console.log(`${LOG_PREFIX} Event=${eventType} EventId=${body?.id || 'N/A'} ResourceId=${resource?.id || 'N/A'}`);

    // Upgrade only on terminal/confirmed events to avoid premature plan activation.
    if (
      eventType === 'PAYMENT.CAPTURE.COMPLETED' ||
      eventType === 'BILLING.SUBSCRIPTION.ACTIVATED'
    ) {
      const uid = await resolveUid(resource, eventType);

      if (!uid) {
        console.warn(`${LOG_PREFIX} Missing uid/custom_id for Event=${eventType} ResourceId=${resource?.id || 'N/A'}`);
        return res.status(200).json({ received: true, skipped: 'missing_uid' });
      }

      const paymentId = resource.id || body.id;
      const eventId = body.id;
      const amount = Number(resource.amount?.value || resource.amount?.total || 0);
      const currency = resource.amount?.currency_code || resource.amount?.currency || 'USD';

      const eventDocRef = eventId ? db.collection('payments').doc(`evt_${eventId}`) : null;
      const paymentDocRef = paymentId ? db.collection('payments').doc(paymentId) : null;
      const userDocRef = db.collection('users').doc(uid);

      const alreadyProcessed = await db.runTransaction(async (tx) => {
        if (eventDocRef) {
          const eventSnap = await tx.get(eventDocRef);
          if (eventSnap.exists) return true;
        }

        if (paymentDocRef) {
          const paymentSnap = await tx.get(paymentDocRef);
          if (paymentSnap.exists && paymentSnap.data()?.status === 'success') return true;
        }

        tx.set(userDocRef, {
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

        if (paymentDocRef) {
          tx.set(paymentDocRef, {
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

        if (eventDocRef) {
          tx.set(eventDocRef, {
            id: `evt_${eventId}`,
            userId: uid,
            gateway: 'PAYPAL',
            status: 'processed',
            eventId,
            eventType,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }

        return false;
      });

      if (alreadyProcessed) {
        console.log(`${LOG_PREFIX} Duplicate skipped EventId=${eventId || 'N/A'} PaymentId=${paymentId || 'N/A'}`);
        return res.status(200).json({ received: true, duplicate: true });
      }

      console.log(`${LOG_PREFIX} Upgrade success User=${uid} Event=${eventType} PaymentId=${paymentId || 'N/A'}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Handler error:`, error);
    return res.status(500).json({ error: error.message || 'Internal Error' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

