
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
    // 🔥 SECURITY: Ye line tumhare Vercel Env Var se secret uthayegi.
    // Tumne jo Vercel me set kiya hai wahi use hoga.
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
          
          const amountPaid = payment.amount / 100; // Razorpay sends amount in paise
          let newTier = 'PRO'; 
          let creditsToAdd = 100000;

          if (amountPaid > 4000) { // Example logic for Business plan
             newTier = 'BUSINESS';
             creditsToAdd = 1000000;
          }

          // Update User Plan
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

          // Log Transaction Success
          await db.collection('payments').doc(payment.id).set({
            id: payment.id,
            userId: userId,
            gateway: 'RAZORPAY',
            amount: amountPaid,
            currency: payment.currency,
            status: 'success',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } 
      // 🔥 HANDLE: Payment Failed (Added Logic)
      else if (eventType === 'payment.failed') {
        const payment = payload.payment.entity;
        console.log(`❌ Payment Failed: ${payment.id}`);
        
        // Log Failure in DB
        await db.collection('payments').doc(payment.id).set({
            id: payment.id,
            gateway: 'RAZORPAY',
            amount: payment.amount / 100,
            currency: payment.currency,
            status: 'failed',
            error_code: payment.error_code,
            error_description: payment.error_description,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
      // HANDLE: Subscription Cancelled
      else if (eventType === 'subscription.cancelled') {
          // Logic to turn off auto-renew if you implement Subscriptions later
          console.log("Subscription Cancelled Event Received");
      }

      // Always return 200 OK to Razorpay so they don't retry
      return res.status(200).json({ status: 'ok' });

    } catch (err: any) {
      console.error("Webhook Logic Error:", err);
      return res.status(200).json({ status: 'error_logged' });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
