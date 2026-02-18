
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

// --- MODULAR FIREBASE INIT ---
if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        })
      });
      console.log(`${LOG_PREFIX} Firebase Admin initialized.`);
    } catch (e) {
      console.error(`${LOG_PREFIX} Firebase init failed:`, e);
    }
  } else {
    console.warn(`${LOG_PREFIX} Missing FIREBASE_PRIVATE_KEY.`);
  }
}

const db = getFirestore();

export const config = {
  api: {
    bodyParser: false, // Essential for signature verification
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

// Helper to get headers case-insensitively
const getHeader = (req: any, key: string) => {
    const keys = Object.keys(req.headers);
    const match = keys.find(k => k.toLowerCase() === key.toLowerCase());
    return match ? req.headers[match] : null;
};

const verifySignature = async (req: any, body: any): Promise<boolean> => {
    if (!PAYPAL_WEBHOOK_ID) {
        if (NODE_ENV === 'production') throw new Error("PAYPAL_WEBHOOK_ID missing in production");
        console.warn(`${LOG_PREFIX} Skipping signature check (Dev Mode)`);
        return true;
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

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
      return res.status(200).json({ status: 'active', time: Date.now() });
  }

  if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Read Raw Body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const body = JSON.parse(rawBody);

    // 2. Verify Signature
    const isValid = await verifySignature(req, body);
    if (!isValid) {
        return res.status(403).json({ error: 'Invalid Signature' });
    }

    const eventType = body.event_type;
    const resource = body.resource;
    
    // 3. Filter Events
    if (eventType !== 'PAYMENT.CAPTURE.COMPLETED') {
        // We acknowledge but ignore other events
        return res.status(200).json({ received: true });
    }

    const customId = resource.custom_id; // This is our userId
    const paymentId = resource.id;
    const amount = resource.amount?.value;
    const currency = resource.amount?.currency_code;

    if (!customId) {
        console.error(`${LOG_PREFIX} Payment ${paymentId} missing custom_id (userId)`);
        return res.status(400).json({ error: 'Missing custom_id' });
    }

    console.log(`${LOG_PREFIX} Processing Upgrade for User: ${customId}`);

    const userRef = db.collection('users').doc(customId);
    const paymentRef = db.collection('payments').doc(paymentId);

    // 4. Atomic Transaction (Idempotency + Upgrade)
    await db.runTransaction(async (t) => {
        const paymentDoc = await t.get(paymentRef);
        
        // Idempotency Check
        if (paymentDoc.exists) {
            console.log(`${LOG_PREFIX} Payment ${paymentId} already processed. Skipping.`);
            return;
        }

        // Upgrade User
        t.set(userRef, {
            tier: 'PRO',
            status: 'active',
            credits: 5000,
            monthlyLimit: 5000,
            renewalDate: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updatedAt: FieldValue.serverTimestamp(),
            autoRenew: true,
            // Nested object for new schema compatibility
            plan: {
                tier: 'PRO',
                status: 'active',
                provider: 'PAYPAL',
                credits: 5000,
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
            }
        }, { merge: true });

        // Record Payment
        t.set(paymentRef, {
            userId: customId,
            eventId: body.id,
            amount: parseFloat(amount),
            currency,
            status: 'success',
            gateway: 'PAYPAL',
            createdAt: FieldValue.serverTimestamp(),
            rawEventType: eventType
        });
    });

    console.log(`${LOG_PREFIX} Successfully upgraded ${customId}`);
    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error(`${LOG_PREFIX} Error:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
