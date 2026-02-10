
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// --- 1. INITIALIZE FIREBASE ADMIN (Server-Side) ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Fix newline issues in private key when stored in env vars
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

const db = admin.firestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ Health Check (GET request from Browser)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "Razorpay webhook active 🚀",
      env_check: process.env.RAZORPAY_WEBHOOK_SECRET ? "Secret Set ✅" : "Secret Missing ❌" 
    });
  }

  // ✅ Webhook Logic (POST request from Razorpay)
  if (req.method === 'POST') {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string;

    // 1. Security Check: Verify Secret exists
    if (!secret) {
      console.error("⚠️ RAZORPAY_WEBHOOK_SECRET is missing in Vercel Env Vars.");
      return res.status(500).send("Server Configuration Error");
    }

    // 2. Security Check: Verify Signature
    try {
      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (generated_signature !== signature) {
        console.warn("⚠️ Invalid Razorpay Signature. Potential spoofing attempt.");
        return res.status(400).send("Invalid Signature");
      }
    } catch (e) {
      console.error("Crypto Error:", e);
      return res.status(500).send("Verification Failed");
    }

    // 3. Process the Event
    const event = req.body;
    const { event: eventType, payload } = event;

    console.log(`🔔 Razorpay Event: ${eventType}`);

    try {
      // HANDLE: Payment Captured (Success)
      if (eventType === 'payment.captured') {
        const payment = payload.payment.entity;
        const notes = payment.notes || {};
        const userId = notes.uid || notes.userId; // Frontend sends 'uid' in notes

        if (userId) {
          console.log(`✅ Payment Captured for User: ${userId}`);
          
          // Determine Plan from Amount (Simple Logic)
          // In production, use 'notes.plan' or 'notes.tier' if sent from frontend
          const amountPaid = payment.amount / 100; // Razorpay sends amount in paise
          let newTier = 'PRO'; 
          let creditsToAdd = 100000;

          if (amountPaid > 4000) { // Example logic for Business plan
             newTier = 'BUSINESS';
             creditsToAdd = 1000000;
          }

          // Update User in Firestore
          await db.collection('users').doc(userId).set({
            plan: {
              tier: newTier,
              status: 'active',
              provider: 'RAZORPAY',
              lastPaymentId: payment.id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              autoRenew: true,
              expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // +30 Days
              credits: creditsToAdd,
              monthlyLimit: creditsToAdd
            }
          }, { merge: true });

          // Log Transaction
          await db.collection('payments').doc(payment.id).set({
            id: payment.id,
            userId: userId,
            gateway: 'RAZORPAY',
            amount: amountPaid,
            currency: payment.currency,
            status: 'success',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
            console.warn("⚠️ Payment received but no User ID in notes.");
        }
      } 
      // HANDLE: Subscription Cancelled (Optional)
      else if (eventType === 'subscription.cancelled') {
          // Logic to turn off auto-renew
      }

      // Always return 200 OK to Razorpay
      return res.status(200).json({ status: 'ok' });

    } catch (err: any) {
      console.error("Webhook Logic Error:", err);
      // Return 200 even on logic error so Razorpay doesn't retry infinitely
      return res.status(200).json({ status: 'error_logged' });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
