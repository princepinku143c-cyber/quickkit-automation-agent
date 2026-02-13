
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// Ensure Admin SDK is initialized
if (!admin.apps.length) {
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
}

const db = admin.firestore();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        console.error("⚠️ RAZORPAY_WEBHOOK_SECRET is missing.");
        return res.status(500).json({ error: "Server Configuration Error" });
    }

    // 1️⃣ Validate Signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        console.error("⛔ Invalid Signature. Potential attack.");
        return res.status(400).json({ error: "Invalid signature" });
    }

    const event = req.body;

    // 2️⃣ Process Payment
    if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const notes = payment.notes || {};
        const userId = notes.uid || notes.userId; // Support both naming conventions
        const tier = notes.tier || 'PRO';

        if (userId) {
            console.log(`💰 Payment Captured: ${payment.id} for User: ${userId}`);

            const limits = {
                'PRO': { credits: 5000, limit: 5000 },
                'BUSINESS': { credits: 20000, limit: 20000 }
            };
            const tierConfig = limits[tier as keyof typeof limits] || limits['PRO'];

            // 3️⃣ Atomic Update (Revenue Critical)
            await db.collection('users').doc(userId).set({
                plan: {
                    tier: tier,
                    status: 'active',
                    provider: 'RAZORPAY',
                    credits: tierConfig.credits,
                    monthlyLimit: tierConfig.limit,
                    lastPaymentId: payment.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    autoRenew: true,
                    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // +30 Days
                },
                // Sync legacy root fields for compatibility
                tier: tier,
                credits: tierConfig.credits,
                monthlyLimit: tierConfig.limit,
                
                // Reset Usage Logic
                usage: { workflows: 0, runs: 0, apiCalls: 0 },
                lastUsageReset: Date.now()
            }, { merge: true });

            // 4️⃣ Log Transaction
            await db.collection('payments').doc(payment.id).set({
                id: payment.id,
                userId: userId,
                gateway: 'RAZORPAY',
                amount: payment.amount / 100, // Convert paise to currency unit
                currency: payment.currency,
                status: 'SUCCESS',
                method: payment.method,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            console.warn("⚠️ Payment captured but no User ID in notes.");
        }
    }

    res.status(200).json({ received: true });

  } catch (err: any) {
    console.error("🔥 Webhook Handler Error:", err);
    res.status(500).json({ error: "Internal Error" });
  }
}
