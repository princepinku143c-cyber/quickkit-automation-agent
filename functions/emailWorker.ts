
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// SMTP TRANSPORT
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendMail = async (to: string, subject: string, html: string) => {
    if (!process.env.EMAIL_USER) {
        console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
        return;
    }
    await transporter.sendMail({
        from: `"NexusStream" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};

// 1. WELCOME EMAIL
export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
    await sendMail(
        user.email || '',
        "Welcome to NexusStream 🚀",
        `<h1>Welcome to the Future of Automation!</h1>
         <p>Your account has been successfully created.</p>
         <p>Start building your first workflow now by visiting the dashboard.</p>`
    );
});

// 2. USAGE WARNING (Firestore Trigger)
// Listens for changes in the usage map and alerts if limits are crossed
export const checkUsageLimit = functions.firestore.document('users/{userId}').onUpdate(async (change, context) => {
    const newData = change.after.data();
    
    const PLAN_LIMITS: any = {
        'FREE': 100,
        'PRO': 5000,
        'BUSINESS': 999999
    };

    const tier = newData.plan?.tier || 'FREE';
    const limit = PLAN_LIMITS[tier] || 100;
    
    const usage = newData.usage?.runs || 0;

    // Check 80% threshold logic with stateful flag
    if (usage >= limit * 0.8 && !newData.warningSent) {
        if (newData.email) {
            await sendMail(
                newData.email,
                "⚠️ Usage Limit Warning",
                `<div style="font-family: sans-serif;">
                    <h2>Usage Alert</h2>
                    <p>You have used <strong>80%</strong> of your monthly workflow runs (${usage}/${limit}).</p>
                    <p>If you hit 100%, your automations will pause.</p>
                    <p><a href="https://nexusstream.site">Upgrade now</a> to ensure uninterrupted service.</p>
                </div>`
            );
            
            // Set flag to true to prevent duplicate emails
            await change.after.ref.update({ warningSent: true });
        }
    }
});

// 3. EXPIRY REMINDER (Scheduled)
export const sendExpiryReminders = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const threeDaysFromNow = Date.now() + (3 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = Date.now() + (4 * 24 * 60 * 60 * 1000);

    const snapshot = await db.collection('users')
        .where('plan.expiresAt', '>=', threeDaysFromNow)
        .where('plan.expiresAt', '<', fourDaysFromNow)
        .get();

    if (snapshot.empty) return;

    const batch = db.batch();
    for (const doc of snapshot.docs) {
        const user = doc.data();
        if (user.email && user.plan?.tier !== 'FREE' && !user.plan?.autoRenew) {
            // Send email async
            sendMail(
                user.email,
                "Plan Expiring Soon ⏳",
                `<p>Your <strong>${user.plan.tier}</strong> plan expires in 3 days.</p>
                 <p>Renew now to keep your advanced features.</p>`
            ).catch(err => console.error("Expiry mail failed", err));
        }
    }
});
