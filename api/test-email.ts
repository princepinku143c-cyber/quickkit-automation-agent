
import { sendMail } from '../lib/mailer';

export default async function handler(req: any, res: any) {
  try {
    if (!process.env.EMAIL_USER) {
        throw new Error("EMAIL_USER env variable is missing.");
    }

    await sendMail(
      process.env.EMAIL_USER, // Send to self
      "NexusStream System Check ✅",
      "<h1>System Operational</h1><p>Your email infrastructure is correctly configured and sending.</p>"
    );

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Email Test Failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
