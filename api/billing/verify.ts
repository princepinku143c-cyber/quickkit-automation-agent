import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const keySecret = process.env.RZP_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('[RAZORPAY_VERIFY] Missing key secret. Rejecting verification request.');
      return res.status(500).json({
        success: false,
        error: 'Payment verification unavailable: missing server secret.'
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[RAZORPAY_VERIFY] Verification API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Verification failed' });
  }
}
