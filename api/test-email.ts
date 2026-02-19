import { sendMail } from '../lib/mailer';

const NODE_ENV = process.env.NODE_ENV || 'development';
const TEST_API_SECRET = process.env.TEST_API_SECRET;

const isAuthorized = (req: any) => {
  const incoming = req.headers['x-test-secret'];
  return !!TEST_API_SECRET && incoming === TEST_API_SECRET;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (NODE_ENV === 'production' && !isAuthorized(req)) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  try {
    if (!process.env.EMAIL_USER) {
      throw new Error('EMAIL_USER env variable is missing.');
    }

    await sendMail(
      process.env.EMAIL_USER,
      'Email Working ✅',
      '<h1>Your email system is working.</h1>'
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Email Test Failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}