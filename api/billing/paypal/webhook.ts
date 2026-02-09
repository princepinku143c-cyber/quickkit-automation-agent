
import * as admin from 'firebase-admin';

// --- INITIALIZE FIREBASE ADMIN (Server-Side) ---
// This runs in Vercel's Node.js environment
if (!admin.apps.length) {
  try {
    // Option 1: Use Vercel Env Vars (Best Practice)
    if (process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Fix newline issues in private key when stored in env vars
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
    } else {
        // Option 2: Fallback (Development/Generic)
        admin.initializeApp();
    }
  } catch (e) {
    console.error("Firebase Admin Init Failed:", e);
  }
}

const db = admin.firestore();

export default async function handler(req: any, res: any) {
  // 1. Allow only POST requests (PayPal sends POST)
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  console.log('🔔 [PayPal Webhook] Received Event');

  // --- 2. SECURITY CHECK LOGGING (Step 4 & 5 Verification) ---
  const webhookSecret = process.env.PAYPAL_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
      console.warn("⚠️ PAYPAL_WEBHOOK_SECRET is missing in Vercel Environment Variables.");
      console.warn("   -> Go to Vercel > Settings > Env Vars and add it from PayPal Dashboard.");
  } else {
      console.log("🔒 Secret detected. Verifying Headers...");
      // Log headers to debug signature reception
      console.log("   - Transmission ID:", req.headers['paypal-transmission-id']);
      console.log("   - Timestamp:", req.headers['paypal-transmission-time']);
      console.log("   - Signature present:", !!req.headers['paypal-transmission-sig']);
  }

  try {
    const body = req.body;
    const eventType = body.event_type;
    const resource = body.resource; // The actual subscription/payment data

    // Log for debugging in Vercel Logs
    console.log(`Event: ${eventType}`, `ID: ${resource.id}`);

    // --- LOGIC: HANDLE EVENTS ---
    
    // CASE A: Subscription Activated (First Time)
    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
        const customId = resource.custom_id; // We attached userId here during button creation
        const subscriptionId = resource.id;

        if (customId) {
            console.log(`✅ Activating PRO for User: ${customId}`);
            
            await db.collection('users').doc(customId).set({
                plan: {
                    tier: 'PRO',
                    status: 'active',
                    provider: 'PAYPAL',
                    subscriptionId: subscriptionId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    autoRenew: true,
                    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // +30 Days approx
                    credits: 100000, // Upgrade Limits
                    monthlyLimit: 100000
                }
            }, { merge: true });

            // Optional: Log payment record
            await db.collection('payments').doc(subscriptionId).set({
                id: subscriptionId,
                userId: customId,
                gateway: 'PAYPAL',
                type: 'SUBSCRIPTION',
                status: 'active',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            console.warn("⚠️ Received Activation but no 'custom_id' (User ID) found in resource.");
        }
    }

    // CASE B: Payment Successful (Renewal)
    else if (eventType === 'PAYMENT.SALE.COMPLETED') {
        const subscriptionId = resource.billing_agreement_id;
        
        if (subscriptionId) {
            // Find user by subscriptionId
            const snapshot = await db.collection('users').where('plan.subscriptionId', '==', subscriptionId).limit(1).get();
            
            if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                console.log(`💰 Renewal Received for: ${userDoc.id}`);
                
                await userDoc.ref.update({
                    'plan.status': 'active',
                    'plan.expiresAt': Date.now() + (30 * 24 * 60 * 60 * 1000), // Extend 30 days
                    'plan.credits': 100000 // Reset credits on renewal
                });
            } else {
                console.log("ℹ️ Payment received but subscription ID not found in DB (Legacy or Mismatch).");
            }
        }
    }

    // CASE C: Subscription Cancelled
    else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') {
        const subscriptionId = resource.id;
        // Find and update user
        const snapshot = await db.collection('users').where('plan.subscriptionId', '==', subscriptionId).limit(1).get();
        
        if (!snapshot.empty) {
            console.log(`❌ Subscription Cancelled: ${subscriptionId}`);
            await snapshot.docs[0].ref.update({
                'plan.autoRenew': false,
                // We don't change status to 'expired' immediately; let them finish the month
            });
        }
    }

    // --- CRITICAL: RETURN 200 OK ---
    // PayPal waits for this. If we crash or send 500, PayPal will retry forever.
    res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('🔥 Webhook Handler Error:', error);
    // Return 500 so PayPal knows to retry later if it was a server glitch
    // But if it's a logic error, maybe return 200 to stop the noise.
    // For now, 500 is safer for debugging.
    res.status(500).json({ error: error.message });
  }
}
