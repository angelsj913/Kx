import { Resend } from "resend";
import nodemailer from "nodemailer";

export type MailMode = "smtp" | "resend" | "dev-log" | "none";

export type SendMailResult = {
  sent: boolean;
  mode: MailMode;
  error?: string;
};

export type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** true면 production에서 발송 수단 없을 때 예외 (sendEmail 호환) */
  throwIfUnconfigured?: boolean;
};

function smtpSecure(port: number): boolean {
  if (process.env.SMTP_SECURE === "false") return false;
  if (process.env.SMTP_SECURE === "true") return true;
  return port === 465;
}

/**
 * 공통 이메일 발송.
 * 1) SMTP  2) Resend  3) dev-log (키 없음, non-production)
 */
export async function sendMail(opts: SendMailOptions): Promise<SendMailResult> {
  const { to, subject, text, html, throwIfUnconfigured = false } = opts;
  const bodyHtml = html ?? text;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port,
        secure: smtpSecure(port),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `ZEFF AI <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html: bodyHtml,
      });
      return { sent: true, mode: "smtp" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[mail:smtp] failed:", msg);
      return { sent: false, mode: "smtp", error: `SMTP 발송 실패: ${msg}` };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM || "ZEFF AI <onboarding@resend.dev>",
        to,
        subject,
        text,
        html: bodyHtml,
      });
      if (result && typeof result === "object" && "error" in result && result.error) {
        const msg =
          (result.error as { message?: string })?.message || JSON.stringify(result.error);
        console.error("[mail:resend] API error:", msg);
        return { sent: false, mode: "resend", error: `Resend 발송 실패: ${msg}` };
      }
      return { sent: true, mode: "resend" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[mail:resend] failed:", msg);
      return { sent: false, mode: "resend", error: `Resend 발송 실패: ${msg}` };
    }
  }

  if (throwIfUnconfigured && process.env.NODE_ENV === "production") {
    throw new Error(
      "이메일 발송이 설정되지 않았습니다. SMTP_USER/SMTP_PASS 또는 RESEND_API_KEY를 등록해 주세요.",
    );
  }
  console.log(`[mail:dev] to=${to}\nsubject=${subject}\n${text}`);
  return { sent: false, mode: "dev-log" };
}

/** sendEmail 호환 — production 미설정 시 throw */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ mode: Exclude<MailMode, "none"> }> {
  const result = await sendMail({ ...opts, throwIfUnconfigured: true });
  if (result.sent) {
    return { mode: result.mode === "none" ? "dev-log" : result.mode };
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(result.error ?? "이메일 발송에 실패했습니다.");
  }
  return { mode: "dev-log" };
}

/** Resend 제한 메시지를 관리자 UI용 한국어로 변환 */
export function friendlyResendError(msg: string): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes("testing domain") ||
    lower.includes("resend.dev") ||
    lower.includes("only send to your own") ||
    lower.includes("verify a domain")
  ) {
    return (
      "Resend 테스트 발신(onboarding@resend.dev)은 Resend 가입 이메일로만 보낼 수 있습니다. " +
      "zeff@zeffai.com 으로 받으려면 Resend에서 zeffai.com 도메인을 인증한 뒤 " +
      "Vercel RESEND_FROM 을 예: ZEFF AI <noreply@zeffai.com> 으로 바꾸세요. " +
      "지금은 아래 화면 인증번호로 진행할 수 있습니다."
    );
  }
  return `Resend 발송 실패: ${msg}`;
}
