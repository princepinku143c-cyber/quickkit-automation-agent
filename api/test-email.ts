
import { sendMail } from '../lib/mailer';

export default async function handler(req: any, res: any) {
  try {
    if (!process.env.EMAIL_USER) {
        throw new Error("EMAIL_USER env variable is missing.");
    }

    await sendMail(
      process.env.EMAIL_USER,
      "Email Working ✅",
      "<h1>Your email system is working.</h1>"
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Email Test Failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
