
import * as admin from 'firebase-admin';

// --- INITIALIZE FIREBASE ADMIN (Server-Side) ---
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

export default async function handler(req: any, res: any) {
  // ✅ Browser / health check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "PayPal webhook alive 🚀",
    });
  }

  // ✅ PayPal webhook
  if (req.method === "POST") {
    console.log("PayPal webhook received");

    // Ack immediately to satisfy PayPal simulator
    return res.status(200).json({ received: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
