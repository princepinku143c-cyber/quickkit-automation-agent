const NODE_ENV = process.env.NODE_ENV || 'development';
const TEST_API_SECRET = process.env.TEST_API_SECRET;

const isAuthorized = (req: any) => {
  const incoming = req.headers['x-test-secret'];
  return !!TEST_API_SECRET && incoming === TEST_API_SECRET;
};

// Deprecated endpoint kept only for controlled diagnostics.
export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (NODE_ENV === 'production' && !isAuthorized(req)) {
    return res.status(404).json({ error: 'Route Not Found' });
  }

  res.status(404).json({ error: 'Route Not Found' });
}