import { Buffer } from 'buffer';
import { validateCoupon } from '../../../lib/serverUtils';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const APP_BASE_URL = process.env.APP_BASE_URL;
const PAYPAL_API = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
const LOG_PREFIX = '[PAYPAL_CREATE_ORDER]';

type PlanTier = 'PRO' | 'BUSINESS';
type BillingCycle = 'monthly' | 'yearly';

const PLAN_CONFIG: Record<PlanTier, { monthly: { credits: number; monthlyLimit: number } }> = {
  PRO: { monthly: { credits: 5000, monthlyLimit: 5000 } },
  BUSINESS: { monthly: { credits: 20000, monthlyLimit: 20000 } },
};

const PRICE_CONFIG: Record<PlanTier, Record<BillingCycle, number>> = {
  PRO: { monthly: 49, yearly: 490 },
  BUSINESS: { monthly: 99, yearly: 990 },
};

const normalizeTier = (value: any): PlanTier => (value === 'BUSINESS' ? 'BUSINESS' : 'PRO');
const normalizeCycle = (value: any): BillingCycle => (value === 'yearly' ? 'yearly' : 'monthly');

export default async function handler(req: any, res: any) {
  const correlationId = (req.headers['x-correlation-id'] as string) || `pp_create_${Date.now()}`;
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !APP_BASE_URL) {
    console.error(`${LOG_PREFIX} [${correlationId}] PayPal credentials or APP_BASE_URL missing.`);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { userId, coupon, tier, cycle, returnState } = req.body;

    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const normalizedCurrency = 'USD';
    const planTier = normalizeTier(tier);
    const planCycle = normalizeCycle(cycle);

    let finalAmount = PRICE_CONFIG[planTier][planCycle];

    const safeReturnState = typeof returnState === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(returnState)
      ? returnState
      : null;

    if (coupon) {
      const promo = await validateCoupon(coupon, planTier, normalizedCurrency);
      if (promo) {
        if (promo.type === 'PERCENT') {
          finalAmount = finalAmount - (finalAmount * promo.value / 100);
        } else {
          finalAmount = Math.max(0, finalAmount - promo.value);
        }
      }
    }

    if (finalAmount <= 0) {
      return res.status(400).json({ error: 'Final amount must be greater than 0 for PayPal checkout.' });
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error(`${LOG_PREFIX} [${correlationId}] PayPal Auth Failed:`, tokenData);
      throw new Error(tokenData.error_description || 'PayPal Authentication Failed');
    }

    const metadataRef = `${planTier}:${planCycle}:${PLAN_CONFIG[planTier].monthly.credits}`;

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: metadataRef,
          amount: {
            currency_code: normalizedCurrency,
            value: finalAmount.toFixed(2)
          },
          custom_id: userId,
          description: `NexusStream ${planTier} ${planCycle} Subscription`
        }],
        application_context: {
          return_url: `${APP_BASE_URL}/?payment_success=true${safeReturnState ? `&state=${encodeURIComponent(safeReturnState)}` : ''}`,
          cancel_url: `${APP_BASE_URL}/?payment_cancel=true${safeReturnState ? `&state=${encodeURIComponent(safeReturnState)}` : ''}`,
          user_action: 'PAY_NOW',
          brand_name: 'NexusStream'
        }
      })
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error(`${LOG_PREFIX} [${correlationId}] PayPal Create Order Failed:`, orderData);
      throw new Error(orderData.message || 'Could not create PayPal order');
    }

    const approvalUrl = orderData.links?.find((l: any) => l.rel === 'approve')?.href;

    if (!approvalUrl) {
      console.error(`${LOG_PREFIX} [${correlationId}] No approval URL in response:`, orderData);
      return res.status(500).json({ error: 'PayPal did not return an approval URL' });
    }

    return res.status(200).json({ approvalUrl });
  } catch (error: any) {
    console.error(`${LOG_PREFIX} [${correlationId}] CreateOrder Exception:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
