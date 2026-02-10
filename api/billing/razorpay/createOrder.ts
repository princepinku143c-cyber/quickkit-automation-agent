
import Razorpay from 'razorpay';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!
      });

      const { amount, currency, notes } = req.body;

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
