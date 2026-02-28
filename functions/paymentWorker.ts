
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// --- SECRETS ---
const RAZORPAY_KEY_ID = process.env.RZP_KEY_ID || '';
const RAZORPAY_SECRET = process.env.RZP_KEY_SECRET || '';

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_SECRET,
});

const safeHandler = async (fn: () => Promise<any>) => {
    try {
        return await fn();
    } catch (error: any) {
        console.error("SafeHandler Error:", error);
        throw new functions.https.HttpsError(error.code || 'internal', error.message || "Operation failed.");
    }
};

// --- CORE UPGRADE LOGIC (Used by verifyPayment) ---
async function processSuccessfulPayment(userId: string, provider: string, refId: string, notes: any) {
    const userRef = db.collection('users').doc(userId);
    
    const tier = notes.tier || 'PRO';
    const limits = {
        'PRO': { credits: 5000, limit: 5000 },
        'BUSINESS': { credits: 20000, limit: 20000 }
    };
    const tierConfig = limits[tier as keyof typeof limits] || limits['PRO'];

    await db.runTransaction(async (t) => {
        // ADDON
        if (notes.type === 'ADDON') {
            const addCredits = parseInt(notes.credits || '0');
            t.update(userRef, {
                'plan.credits': admin.firestore.FieldValue.increment(addCredits)
            });
            return;
        }

        // SUBSCRIPTION UPGRADE
        const newExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
        t.set(userRef, {
            plan: {
                tier: tier,
                status: 'active',
                provider: provider,
                lastPaymentId: refId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                autoRenew: true,
                expiresAt: newExpiry, 
                credits: tierConfig.credits,
                monthlyLimit: tierConfig.limit
            },
            tier: tier, // Legacy sync
            // Reset Usage
            usage: { workflows: 0, runs: 0, apiCalls: 0 },
            lastUsageReset: Date.now(),
            warningSent: false,
            expiresAt: newExpiry
        }, { merge: true });
    });
}

// --- VERIFY PAYMENT ---
export const verifyPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User not logged in');

    return safeHandler(async () => {
        const { paymentId, orderId, signature } = data;

        if (!paymentId || !orderId || !signature) throw new Error("Missing verification credentials.");

        // HMAC Check
        const generatedSignature = crypto.createHmac('sha256', RAZORPAY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest('hex');

        if (generatedSignature !== signature) {
            throw new Error("Invalid Payment Signature.");
        }

        const orderDoc = await db.collection('payments').doc(orderId).get();
        if (!orderDoc.exists) throw new Error("Order not found.");
        
        const orderData = orderDoc.data();
        
        await processSuccessfulPayment(context.auth!.uid, 'RAZORPAY', paymentId, { 
            tier: orderData?.plan, 
            type: orderData?.type || 'SUBSCRIPTION',
            credits: orderData?.credits
        });

        await orderDoc.ref.update({
            status: 'success',
            paymentId: paymentId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    });
});

// --- CREATE ORDER ---
export const createOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    return safeHandler(async () => {
        const { type, tier, packId, credits, amount, currency } = data;
        const uid = context.auth!.uid;
        
        const order = await razorpay.orders.create({
            amount: amount * 100, 
            currency: currency || 'USD',
            receipt: `rcpt_${uid.substring(0,6)}_${Date.now()}`,
            notes: { uid, type, tier, packId, credits }
        });

        await db.collection('payments').doc(order.id).set({
            id: order.id,
            userId: uid,
            gateway: 'RAZORPAY',
            type: type || 'SUBSCRIPTION',
            plan: tier,
            credits: credits, // Store credits for addon packs
            amount: amount,
            currency: currency,
            status: 'created',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { id: order.id, amount: order.amount, currency: order.currency };
    });
});
