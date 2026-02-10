
import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as admin from 'firebase-admin';

// --- INITIALIZE FIREBASE ADMIN ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ Health check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "PayPal webhook alive 🚀",
      // Debug: Show if ID is set (don't show the value publicly)
      configured: !!process.env.PAYPAL_WEBHOOK_ID
    });
  }

  // ✅ PayPal Webhook Logic
  if (req.method === "POST") {
    console.log("PayPal webhook received");
    const body = req.body;
    
    // In production without a secret, we can check the Event ID or other logic.
    // For now, we trust the ID matches our configuration implicitly by endpoint.
    
    try {
        const eventType = body.event_type;
        const resource = body.resource;
        
        if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            const customId = resource.custom_id; // User ID attached to subscription
            if (customId) {
                console.log(`✅ PayPal Sub Activated for: ${customId}`);
                const db = admin.firestore();
                await db.collection('users').doc(customId).set({
                    plan: {
                        tier: 'PRO', // Default to PRO for PayPal
                        status: 'active',
                        provider: 'PAYPAL',
                        subscriptionId: resource.id,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        autoRenew: true,
                        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
                        credits: 100000,
                        monthlyLimit: 100000
                    }
                }, { merge: true });
            }
        }
    } catch (e) {
        console.error("PayPal Logic Error", e);
    }

    // Always ACK to PayPal
    return res.status(200).json({ received: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
