import { Resend } from "resend";
import nodemailer from "nodemailer";

/**
 * 범용 이메일 발송 헬퍼. OTP 발송(otp.ts)과 동일한 우선순위를 따른다.
 * 1) Gmail SMTP(SMTP_USER/SMTP_PASS) → 2) Resend(RESEND_API_KEY) → 3) 미설정(개발 로그).
 * 키가 없으면 { sent: false } 를 반환하며 예외를 던지지 않는다.
 */
export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean }> {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `ZEFF AI <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html ?? text,
    });
    return { sent: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "ZEFF AI <onboarding@resend.dev>",
      to,
      subject,
      text,
      html: html ?? text,
    });
    return { sent: true };
  }

  console.log(`[mail:dev] ${to} :: ${subject}`);
  return { sent: false };
}
