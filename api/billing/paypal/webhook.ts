
import * as admin from 'firebase-admin';

// --- CRASH GUARD #1: FIREBASE DOUBLE-INIT PREVENTION ---
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
        console.log("🔥 Firebase Admin Initialized");
    } else {
        console.warn("⚠️ FIREBASE_PRIVATE_KEY is missing. Database operations will fail.");
    }
  } catch (e) {
    console.error("🔥 Firebase Init Failed:", e);
  }
}

const db = admin.firestore();

export default async function handler(req: any, res: any) {
  // --- CRASH GUARD #2: BROWSER HEALTH CHECK ---
  if (req.method === 'GET') {
      return res.status(200).json({ ok: true, status: 'PayPal Webhook Live' });
  }

  // --- CRASH GUARD #3: IGNORE NON-POST ---
  if (req.method !== 'POST') {
    return res.status(200).send('Method Not Allowed');
  }

  try {
    const body = req.body;
    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`🔔 PayPal Event: ${eventType} | ID: ${resource?.id}`);

    // --- BUSINESS LOGIC ---
    if (
      eventType === 'CHECKOUT.ORDER.APPROVED' || 
      eventType === 'PAYMENT.CAPTURE.COMPLETED' || 
      eventType === 'BILLING.SUBSCRIPTION.ACTIVATED'
    ) {
        const uid = resource.custom_id;
        if (uid) {
            console.log(`✅ PayPal: Upgrading user ${uid} to PRO`);
            await db.collection('users').doc(uid).set({
                plan: {
                    tier: 'PRO',
                    status: 'active',
                    provider: 'PAYPAL',
                    credits: 5000,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    autoRenew: true
                }
            }, { merge: true });

            await db.collection('payments').doc(resource.id).set({
                id: resource.id,
                userId: uid,
                gateway: 'PAYPAL',
                amount: resource.amount?.total || '0',
                status: 'success',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    // --- CRASH GUARD #4: ALWAYS RETURN 200 ---
    res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('🔥 PayPal Webhook Error:', error);
    // Return 200 anyway to stop PayPal from retrying
    res.status(200).json({ error: 'Internal Error (Logged)', received: true });
  }
}
