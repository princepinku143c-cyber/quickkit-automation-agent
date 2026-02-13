import Razorpay from 'razorpay';

export default async function handler(req: any, res: any) {
  // Optimization: Allow client-side caching of errors or non-sensitive data if needed
  // For POST requests, we usually don't cache, but we can set headers to explicit no-store for security
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') return res.status(405).end();

  try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!
      });

      const { amount, currency, notes } = req.body;

      // Basic Rate Limiting Check (Simulated for Serverless)
      // In production, use Redis. Here we check logic validity to prevent spam.
      if (!amount || amount < 100) {
          return res.status(400).json({ error: "Invalid amount" });
      }

      // Create Order
      const order = await razorpay.orders.create({
        amount: amount, // Amount in lowest denomination (paise for INR)
        currency: currency || "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: notes || {}
      });

      res.status(200).json(order);
  } catch (err: any) {
      console.error("Create Order Error:", err);
      res.status(500).json({ error: err.message });
  }
}