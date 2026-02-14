
import * as admin from 'firebase-admin';
import crypto from 'crypto';
import { Buffer } from 'buffer';

// --- 1. SAFE FIREBASE INIT ---
// Prevents "Apps already exists" or "Undefined" errors
if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined,
            })
        });
    } catch (e) {
        console.error("Firebase Admin Init Error:", e);
    }
}

const db = admin.firestore();

// --- 2. CONFIG: DISABLE BODY PARSER ---
// Essential for Vercel/Next.js to verify webhook signatures
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper: Read raw stream for HMAC verification
async function getRawBody(readable: any): Promise<string> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: any, res: any) {
  // Health Check for Browser access (Prevents 500 crash on GET)
  if (req.method !== 'POST') {
      return res.status(200).json({ status: 'active', message: 'Razorpay Webhook Endpoint' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'] as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
        console.error("⚠️ Webhook Config Missing: Signature or Secret");
        return res.status(400).json({ error: "Configuration Error" });
    }

    // --- 3. SECURITY: HMAC CHECK ---
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(rawBody);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        console.error("⛔ Invalid Webhook Signature");
        return res.status(400).json({ error: "Invalid signature" });
    }

    // Parse verified body
    const event = JSON.parse(rawBody);

    // --- 4. BUSINESS LOGIC ---
    if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const notes = payment.notes || {};
        const userId = notes.uid || notes.userId; 
        
        if (userId) {
            console.log(`💰 Webhook: Payment ${payment.id} for User ${userId}`);

            const tier = notes.tier || 'PRO';
            const limits = {
                'PRO': { credits: 5000, limit: 5000 },
                'BUSINESS': { credits: 20000, limit: 20000 }
            };
            const config = limits[tier as keyof typeof limits] || limits['PRO'];

            // Atomic Update
            await db.collection('users').doc(userId).set({
                plan: {
                    tier: tier,
                    status: 'active',
                    provider: 'RAZORPAY',
                    credits: config.credits,
                    monthlyLimit: config.limit,
                    lastPaymentId: payment.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    autoRenew: true,
                    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // +30 Days
                },
                tier: tier, // Sync legacy
                credits: config.credits,
                monthlyLimit: config.limit
            }, { merge: true });

            // Log Payment
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
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
