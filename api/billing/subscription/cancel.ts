export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { subscriptionId, provider } = req.body || {};
  if (!subscriptionId || typeof subscriptionId !== 'string') {
    return res.status(400).json({ success: false, error: 'subscriptionId is required' });
  }

  return res.status(501).json({
    success: false,
    error: 'Subscription cancellation API is not enabled yet. Please contact support.',
    subscriptionId,
    provider: provider || 'UNKNOWN'
  });
}
