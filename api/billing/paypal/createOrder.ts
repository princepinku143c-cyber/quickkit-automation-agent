
import { Buffer } from 'buffer';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API = process.env.PAYPAL_ENV === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error("PayPal credentials missing in environment variables.");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { amount, currency, notes } = req.body;

        // 1. Get Access Token
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Auth failed');

        // 2. Create Order
        const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: currency || 'USD',
                        value: (amount / 100).toFixed(2) // Convert cents to dollars if needed, assuming input is smallest unit
                    },
                    custom_id: notes?.userId // Attach User ID for Webhook tracking
                }],
                application_context: {
                    user_action: 'PAY_NOW',
                    return_url: `${req.headers.origin}/?payment_success=true`, // Simple return handling
                    cancel_url: `${req.headers.origin}/?payment_cancel=true`
                }
            })
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderData.message || 'Order creation failed');

        // 3. Extract Approval Link
        const approvalLink = orderData.links.find((l: any) => l.rel === 'approve');

        return res.status(200).json({
            id: orderData.id,
            approvalUrl: approvalLink?.href
        });

    } catch (error: any) {
        console.error("PayPal Create Order Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
