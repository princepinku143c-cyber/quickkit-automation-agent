
import * as admin from 'firebase-admin';

// Initialize Admin SDK if not already done (Singleton pattern)
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
            admin.initializeApp(); // Fallback for local emulators
        }
    } catch (e) {
        console.error("Firebase Admin Init Error:", e);
    }
}

const db = admin.firestore();

/**
 * 🔒 Middleware: Throws error if user is not an Admin.
 */
export async function requireAdmin(userId: string) {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
      throw new Error("User not found");
  }
  
  const userData = userDoc.data();
  if (userData?.role !== "ADMIN" && userData?.role !== "OWNER") {
    throw new Error("ACCESS_DENIED: Admin privileges required.");
  }
}

/**
 * ⏳ Cron Logic: Downgrades users if their plan has expired.
 * Call this on login or via scheduled job.
 */
export async function checkPlanExpiry(userId: string) {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  const user = userDoc.data();
  if (!user) return;

  // Check if expired and NOT on free plan
  if (user.plan?.tier !== 'FREE' && user.plan?.expiresAt && Date.now() > user.plan.expiresAt) {
    console.log(`[Auto-Downgrade] Expiring plan for ${userId}`);
    
    // Atomic Downgrade
    await userRef.update({
      'plan.tier': "FREE",
      'plan.status': "expired",
      'plan.credits': 5,
      'plan.monthlyLimit': 5,
      'plan.expiresAt': 0,
      
      // Update root compatibility fields if you use them
      tier: "FREE",
      credits: 5,
      monthlyLimit: 5
    });
  }
}
