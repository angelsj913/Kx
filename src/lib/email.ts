import { Resend } from "resend";
import nodemailer from "nodemailer";

/**
 * 공통 이메일 발송.
 * 1) SMTP (Gmail 등)  2) Resend  3) 개발 모드 콘솔 로그
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ mode: "smtp" | "resend" | "dev-log" }> {
  const { to, subject, text, html } = opts;

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
      html,
    });
    return { mode: "smtp" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "ZEFF AI <onboarding@resend.dev>",
      to,
      subject,
      text,
      html,
    });
    if (result && typeof result === "object" && "error" in result && result.error) {
      const msg =
        (result.error as { message?: string })?.message ||
        JSON.stringify(result.error);
      throw new Error(`Resend 발송 실패: ${msg}`);
    }
    return { mode: "resend" };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "이메일 발송이 설정되지 않았습니다. SMTP_USER/SMTP_PASS 또는 RESEND_API_KEY를 등록해 주세요.",
    );
  }

  console.log(`[email:dev] to=${to}\nsubject=${subject}\n${text}`);
  return { mode: "dev-log" };
}

/** 워크스페이스 초대 메일 */
export async function sendWorkspaceInviteEmail(opts: {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}) {
  const roleLabel = opts.role === "admin" ? "관리자" : "멤버";
  const expires = opts.expiresAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `[ZEFF AI] ${opts.workspaceName} 워크스페이스 초대`;
  const text = [
    `${opts.inviterName}님이 ZEFF AI 「${opts.workspaceName}」 워크스페이스에 ${roleLabel}(으)로 초대했습니다.`,
    "",
    "아래 링크를 열어 초대를 수락하세요.",
    opts.inviteUrl,
    "",
    `이 초대는 ${expires}까지 유효합니다.`,
    "",
    "ZEFF AI",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="ko">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#2563eb,#6366f1);color:#fff;font-weight:700;font-size:14px;padding:8px 14px;border-radius:10px;">ZEFF AI</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <h1 style="margin:0;font-size:20px;line-height:1.4;color:#0f172a;">워크스페이스 초대</h1>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#475569;">
                <strong style="color:#2563eb;">${escapeHtml(opts.inviterName)}</strong>님이<br/>
                <strong>「${escapeHtml(opts.workspaceName)}」</strong>에<br/>
                ${roleLabel}(으)로 초대했습니다.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;text-align:center;">
              <a href="${opts.inviteUrl}"
                 style="display:inline-block;background:linear-gradient(90deg,#2563eb,#4f46e5);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:12px;">
                초대 수락하기
              </a>
              <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;word-break:break-all;">
                버튼이 안 되면 이 링크를 브라우저에 붙여넣으세요.<br/>
                ${escapeHtml(opts.inviteUrl)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                이 초대는 ${escapeHtml(expires)}까지 유효합니다.<br/>
                본인이 요청하지 않았다면 이 메일을 무시하세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return sendEmail({ to: opts.to, subject, text, html });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
