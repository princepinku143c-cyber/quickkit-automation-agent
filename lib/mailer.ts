
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendMail(
  to: string,
  subject: string,
  html: string
) {
  if (!process.env.EMAIL_USER) {
      console.log("⚠️ Email Skipped (Not Configured):", { to, subject });
      return;
  }
  
  await transporter.sendMail({
    from: `"NexusStream" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
