
import nodemailer from "nodemailer";

// Singleton Transporter
// Ensure process.env.EMAIL_USER and EMAIL_PASS are set in your Vercel/Firebase env
export const transporter = nodemailer.createTransport({
  service: "gmail", // Or use 'host' and 'port' for custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER) {
    console.warn("⚠️ Email not configured: ", { to, subject });
    return;
  }

  await transporter.sendMail({
    from: `"NexusStream" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
