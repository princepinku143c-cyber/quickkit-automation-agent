
import { Buffer } from 'buffer';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const APP_BASE_URL = process.env.APP_BASE_URL;
const PAYPAL_API = process.env.PAYPAL_ENV === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error("CRITICAL: PayPal credentials missing.");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { amount, currency, notes } = req.body;
        const uid = notes?.userId;
        const origin = APP_BASE_URL || req.headers.origin;
        const normalizedAmount = Number(amount);
        const normalizedCurrency = (currency || 'USD').toUpperCase();

        if (!uid) {
            return res.status(400).json({ error: 'Missing notes.userId' });
        }

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
            return res.status(400).json({ error: 'Invalid currency code' });
        }

        if (!origin) {
            return res.status(500).json({ error: 'Missing APP_BASE_URL/Origin for PayPal return URLs' });
        }
        const { amount, currency, userId } = req.body;

        // 1. Strict Input Validation
        if (!userId) return res.status(400).json({ error: 'Missing userId' });
        if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Invalid amount' });
        
        const normalizedCurrency = (currency || 'USD').toUpperCase();
        
        // 2. Get Access Token
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
            console.error("PayPal Auth Failed:", tokenData);
            throw new Error(tokenData.error_description || 'PayPal Authentication Failed');
        }

        // 3. Create Order
        // Note: custom_id is essential for the webhook to know which user to upgrade
        const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: normalizedCurrency,
                        value: (normalizedAmount / 100).toFixed(2) // Convert cents to dollars if needed, assuming input is smallest unit
                    },
                    custom_id: uid, // Attach User ID for Webhook tracking
                    invoice_id: `NX-${uid}-${Date.now()}`
                        value: Number(amount).toFixed(2)
                    },
                    custom_id: userId,
                    description: "NexusStream PRO Plan Subscription"
                }],
                application_context: {
                    return_url: `${APP_BASE_URL}/?payment_success=true`,
                    cancel_url: `${APP_BASE_URL}/?payment_cancel=true`,
                    user_action: 'PAY_NOW',
                    return_url: `${origin}/?payment_success=true`, // Simple return handling
                    cancel_url: `${origin}/?payment_cancel=true`
                    brand_name: 'NexusStream'
                }
            })
        });

        const orderData = await orderRes.json();
        
        if (!orderRes.ok) {
            console.error("PayPal Create Order Failed:", orderData);
            throw new Error(orderData.message || 'Could not create PayPal order');
        }

        // 3. Extract Approval Link
        const approvalLink = orderData.links.find((l: any) => l.rel === 'approve');
        if (!approvalLink?.href) {
            throw new Error('PayPal approval URL missing from create order response');
        }

        return res.status(200).json({
            id: orderData.id,
            approvalUrl: approvalLink.href
        });
        // 4. Extract Approval Link
        const approvalUrl = orderData.links?.find((l: any) => l.rel === 'approve')?.href;
        
        if (!approvalUrl) {
            console.error("No approval URL in response:", orderData);
            return res.status(500).json({ error: 'PayPal did not return an approval URL' });
        }

        return res.status(200).json({ approvalUrl });

    } catch (error: any) {
        console.error("CreateOrder Exception:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
