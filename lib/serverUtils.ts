
import * as admin from 'firebase-admin';

// Initialize Admin SDK (Shared Singleton)
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

/**
 * Checks if a user's plan has expired and downgrades them if necessary.
 */
export async function checkPlanExpiry(userId: string) {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  const user = userDoc.data();

  if (!user) return;

  if (user.plan?.tier !== 'FREE' && user.plan?.expiresAt && Date.now() > user.plan.expiresAt) {
    await userRef.update({
      'plan.tier': "FREE",
      'plan.credits': 5,
      'plan.monthlyLimit': 5,
      'plan.expiresAt': 0,
      // Sync root for legacy
      tier: "FREE",
      credits: 5,
      monthlyLimit: 5
    });
  }
}

/**
 * Throws error if user is not an Admin.
 */
export async function requireAdmin(userId: string) {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists || (userDoc.data()?.role !== "ADMIN" && userDoc.data()?.role !== "OWNER")) {
    throw new Error("Access denied. Admin privileges required.");
  }
}
