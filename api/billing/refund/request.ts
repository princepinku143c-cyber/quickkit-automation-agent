export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { paymentId, reason } = req.body || {};
  if (!paymentId || typeof paymentId !== 'string') {
    return res.status(400).json({ success: false, error: 'paymentId is required' });
  }

  return res.status(501).json({
    success: false,
    error: 'Refund API is not enabled yet. Please contact support for manual processing.',
    paymentId,
    reason: reason || 'N/A'
  });
}
