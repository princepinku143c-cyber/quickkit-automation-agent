export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { packId, region } = req.body || {};
  if (!packId || typeof packId !== 'string') {
    return res.status(400).json({ success: false, error: 'packId is required' });
  }

  return res.status(501).json({
    success: false,
    error: 'Add-on purchase API is not enabled yet. Please contact support.',
    packId,
    region: region || 'GLOBAL'
  });
}
