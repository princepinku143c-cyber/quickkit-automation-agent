import crypto from "crypto";
import admin from "firebase-admin";
import { Buffer } from "buffer";

// --- 1. SAFE FIREBASE INIT (Vercel Compatible) ---
// Checks if admin.apps exists AND has length to prevent undefined crashes
if (!admin.apps || !admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey.replace(/\\n/g, "\n"),
            }),
        });
    }
  } catch (e) {
      console.error("Firebase Admin Init Error:", e);
  }
}

// --- 2. CONFIG: DISABLE BODY PARSER ---
// Essential: We need the raw stream to verify the signature
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  try {
    // --- 3. BROWSER HEALTH CHECK ---
    // Prevents "Function Invocation Failed" when opening in browser
    if (req.method === "GET") {
      return res.status(200).json({ status: "Webhook live", mode: "Vercel Node.js" });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // --- 4. READ RAW BODY (BUFFER) ---
    const buffers: any[] = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();

    // --- 5. VERIFY SIGNATURE ---
    const signature = req.headers["x-razorpay-signature"] as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.error("Missing signature or secret");
      return res.status(400).json({ error: "Configuration missing" });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      console.error("Signature Mismatch");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // --- 6. PROCESS EVENT ---
    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      // Extract userId from notes (sent via frontend)
      const userId = payment.notes?.userId || payment.notes?.uid;

      if (!userId) {
        console.warn(`Payment ${payment.id} missing userId in notes`);
        return res.status(400).json({ error: "No userId in notes" });
      }

      console.log(`✅ Upgrade User: ${userId}`);

      // Safe Atomic Update
      await admin.firestore().collection("users").doc(userId).set(
        {
          plan: {
            tier: "PRO",
            status: "active",
            provider: "RAZORPAY",
            credits: 5000,
            monthlyLimit: 5000,
            lastPaymentId: payment.id,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 Days
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            autoRenew: true
          },
          // Sync root fields for legacy components
          tier: "PRO",
          credits: 5000
        },
        { merge: true }
      );
      
      // Log Payment
      await admin.firestore().collection("payments").doc(payment.id).set({
          id: payment.id,
          userId: userId,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: 'success',
          gateway: 'RAZORPAY',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("Webhook Crash:", error);
    // Return 500 so Razorpay retries later
    return res.status(500).json({ error: "Webhook crashed", details: error.message });
  }
}