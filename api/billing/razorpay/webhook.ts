
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// --- INIT GUARD ---
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
    }
  } catch (e) { console.error("Firebase Init Failed", e); }
}

const db = admin.firestore();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(200).end();

  try {
    // Note: Vercel functions parse body by default. 
    // To verify signature, we need raw body. 
    // For this implementation, we assume req.body is JSON and we stringify it (approximation).
    // In production Vercel, you might need `export const config = { api: { bodyParser: false } }`
    // and read the stream. Here we use a safe approximation for demo.
    
    const signature = req.headers['x-razorpay-signature'] as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Skip signature check if secret not configured (Dev Mode)
    if (secret) {
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');
        if (digest !== signature) {
            console.error("Invalid Razorpay Signature");
            return res.status(200).json({ invalid: true }); // Return 200 to stop retry loop
        }
    }

    const event = req.body;
    
    if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const uid = payment.notes?.uid;
        
        if (uid) {
            console.log(`✅ Razorpay: Upgrading user ${uid} to PRO`);
            await db.collection('users').doc(uid).set({
                plan: {
                    tier: 'PRO',
                    status: 'active',
                    provider: 'RAZORPAY',
                    credits: 5000,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    autoRenew: true
                }
            }, { merge: true });

            await db.collection('payments').doc(payment.id).set({
                id: payment.id,
                userId: uid,
                gateway: 'RAZORPAY',
                amount: payment.amount / 100, // Convert paise to INR
                status: 'success',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }

  } catch (err) {
    console.error("Razorpay Webhook Error:", err);
  }

  return res.status(200).json({ received: true });
}
