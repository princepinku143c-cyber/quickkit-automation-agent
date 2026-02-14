
import * as admin from 'firebase-admin';
import crypto from 'crypto';
import { Buffer } from 'buffer';

// --- INIT FIREBASE ADMIN ---
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
        } else {
            admin.initializeApp();
        }
    } catch (e) {
        console.error("Firebase Admin Init Error:", e);
    }
}

const db = admin.firestore();

// 🔥 CRITICAL: Disable default body parser to get raw stream for HMAC signature
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body from stream
async function getRawBody(readable: any): Promise<string> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'] as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
        console.error("⚠️ Missing Signature or Secret");
        return res.status(400).json({ error: "Configuration Error" });
    }

    // 1️⃣ Validate Signature (HMAC SHA256)
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(rawBody);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        console.error("⛔ Invalid Signature. Potential attack.");
        return res.status(400).json({ error: "Invalid signature" });
    }

    // 2️⃣ Parse JSON safely
    const event = JSON.parse(rawBody);

    // 3️⃣ Process Payment
    if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const notes = payment.notes || {};
        const userId = notes.uid || notes.userId; 
        
        // Default to PRO if not specified, or use logic from notes
        const tier = notes.tier || 'PRO'; 

        if (userId) {
            console.log(`💰 Payment Captured: ${payment.id} for User: ${userId}`);

            // ATOMIC UPGRADE
            await db.collection('users').doc(userId).set({
                plan: {
                    tier: tier,
                    status: 'active',
                    provider: 'RAZORPAY',
                    credits: 9999, // As requested
                    monthlyLimit: 9999,
                    lastPaymentId: payment.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    autoRenew: true,
                    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // +30 Days
                },
                // Sync root fields for backward compatibility
                tier: tier,
                credits: 9999,
                monthlyLimit: 9999,
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
            }, { merge: true });

            // LOG TRANSACTION
            await db.collection('payments').doc(payment.id).set({
                id: payment.id,
                userId: userId,
                gateway: 'RAZORPAY',
                amount: payment.amount / 100,
                currency: payment.currency,
                status: 'SUCCESS',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error("🔥 Webhook Handler Error:", err);
    return res.status(500).json({ error: "Internal Error" });
  }
}
