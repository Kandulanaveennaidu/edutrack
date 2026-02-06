import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: EmailOptions): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("📧 Email (dev mode - no SMTP configured):");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  [Email sent in dev mode - configure SMTP for production]`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"EduTrack" <noreply@edutrack.com>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
}
