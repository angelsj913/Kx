import { Resend } from "resend";
import nodemailer from "nodemailer";
import { prisma } from "./prisma";

export type OtpChannel = "email" | "sms";
export type OtpPurpose =
  | "signup"
  | "find-id"
  | "find-password"
  | "workspace-delete"
  | "admin-plan-change"; // 관리자 회원 요금제 변경 2단계 인증

const CODE_TTL_MS = 3 * 60 * 1000; // 3분

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hasEmailProvider(): boolean {
  return (
    !!(process.env.SMTP_USER && process.env.SMTP_PASS) ||
    !!process.env.RESEND_API_KEY
  );
}

export type IssueOtpResult = {
  /** 실제 발송 성공 여부 */
  sent: boolean;
  mode: "smtp" | "resend" | "sms" | "dev-log" | "none";
  /** 개발 또는 메일 미설정/실패 시 화면에 보여줄 코드 (admin 폴백 포함) */
  devCode?: string;
  /** 발송 실패 사유 (있으면) */
  mailError?: string;
};

/** 6자리 코드를 발급·저장하고 채널로 발송한다. */
export async function issueOtp(
  identifier: string,
  channel: OtpChannel,
  purpose: OtpPurpose
): Promise<IssueOtpResult> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  // 같은 대상·목적의 이전 미사용 코드는 정리
  await prisma.verificationCode.deleteMany({
    where: { identifier, purpose, consumedAt: null },
  });
  await prisma.verificationCode.create({
    data: { identifier, channel, purpose, code, expiresAt },
  });

  if (channel === "sms") {
    const sms = await sendSmsOtp(identifier, code);
    // 이메일 경로와 동일한 기준을 적용한다 — sms는 실제 발송이 구현돼 있지 않으므로
    // (sendSmsOtp는 항상 sent:false) 운영 환경에서는 코드를 절대 인라인으로 돌려주지
    // 않는다. 예전엔 이 분기만 게이트 없이 항상 devCode를 반환해서, 채널만
    // "sms"로 바꿔 보내면 실제 코드를 그대로 받아갈 수 있었다(이메일 소유 증명 불필요).
    const allowInlineCode = !sms.sent && process.env.NODE_ENV !== "production";
    return {
      sent: sms.sent,
      mode: sms.mode,
      mailError: sms.error,
      devCode: allowInlineCode ? code : undefined,
    };
  }

  const mail = await sendEmailOtp(identifier, code, purpose);

  // 메일이 안 나갔을 때: 개발 환경이거나 관리자 요금제 변경이면 코드를 응답에 포함
  // (운영에서 메일 키 미설정/Resend 제한으로 막혀도 관리 작업이 가능하도록)
  const allowInlineCode =
    !mail.sent &&
    (process.env.NODE_ENV !== "production" ||
      purpose === "admin-plan-change" ||
      process.env.ADMIN_OTP_INLINE === "1");

  return {
    sent: mail.sent,
    mode: mail.mode,
    mailError: mail.error,
    devCode: allowInlineCode ? code : undefined,
  };
}

/** 코드 검증. 성공 시 소비 처리하고 true. */
export async function verifyOtp(
  identifier: string,
  purpose: OtpPurpose,
  code: string
): Promise<boolean> {
  const row = await prisma.verificationCode.findFirst({
    where: { identifier, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;
  if (row.expiresAt.getTime() < Date.now()) return false;
  if (row.code !== code) return false;

  await prisma.verificationCode.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return true;
}

/** 최근 인증에 성공(소비)한 기록이 있는지 — 회원가입 최종 처리 직전 재확인용. */
export async function hasRecentVerifiedOtp(
  identifier: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const row = await prisma.verificationCode.findFirst({
    where: {
      identifier,
      purpose,
      consumedAt: { not: null, gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
    orderBy: { consumedAt: "desc" },
  });
  return !!row;
}

type MailResult = {
  sent: boolean;
  mode: "smtp" | "resend" | "dev-log" | "none";
  error?: string;
};

async function sendEmailOtp(
  email: string,
  code: string,
  purpose: OtpPurpose = "signup"
): Promise<MailResult> {
  const isAdminPlan = purpose === "admin-plan-change";
  const subject = isAdminPlan
    ? "[ZEFF AI] 관리자 · 요금제 변경 인증번호"
    : "[ZEFF AI] 인증번호";
  const text = isAdminPlan
    ? `ZEFF AI 관리자 요금제 변경 인증번호는 ${code} 입니다. 3분 안에 입력해 주세요. 본인이 요청하지 않았다면 무시하세요.`
    : `ZEFF AI 인증번호는 ${code} 입니다. 3분 안에 입력해 주세요.`;
  const html = isAdminPlan
    ? `<div style="font-family:sans-serif;padding:24px;max-width:420px">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#2563eb">ZEFF AI · 관리자</p>
        <p style="margin:0 0 12px;font-size:15px;color:#0f172a">회원 요금제 변경 인증번호</p>
        <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:6px;color:#0f172a">${code}</p>
        <p style="margin:16px 0 0;font-size:13px;color:#64748b">3분 안에 관리자 패널에 입력해 주세요. 요청하지 않았다면 이 메일을 무시하세요.</p>
      </div>`
    : `<div style="font-family:sans-serif;padding:24px"><p>ZEFF AI 인증번호</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p style="color:#64748b">3분 안에 입력해 주세요.</p></div>`;

  // 1) SMTP (Gmail 등)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT || 465);
      const secure =
        process.env.SMTP_SECURE === "false"
          ? false
          : process.env.SMTP_SECURE === "true"
            ? true
            : port === 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port,
        secure,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `ZEFF AI <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        text,
        html,
      });
      return { sent: true, mode: "smtp" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[OTP:email:smtp] failed:", msg);
      return { sent: false, mode: "smtp", error: `SMTP 발송 실패: ${msg}` };
    }
  }

  // 2) Resend
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const from =
        process.env.RESEND_FROM || "ZEFF AI <onboarding@resend.dev>";
      const result = await resend.emails.send({
        from,
        to: email,
        subject,
        text,
        html,
      });
      // Resend SDK 는 예외 대신 { error } 를 반환하는 경우가 많음
      if (result && typeof result === "object" && "error" in result && result.error) {
        const errObj = result.error as { message?: string; name?: string; statusCode?: number };
        const msg = errObj?.message || JSON.stringify(result.error);
        console.error("[OTP:email:resend] API error:", msg);
        return {
          sent: false,
          mode: "resend",
          error: friendlyResendError(msg),
        };
      }
      return { sent: true, mode: "resend" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[OTP:email:resend] failed:", msg);
      return { sent: false, mode: "resend", error: friendlyResendError(msg) };
    }
  }

  // 3) 발송 수단 없음
  console.log(`[OTP:email:dev] ${email} -> ${code} (purpose=${purpose})`);
  if (process.env.NODE_ENV === "production") {
    return {
      sent: false,
      mode: "none",
      error:
        "이메일 발송이 설정되지 않았습니다. Vercel에 SMTP_USER/SMTP_PASS 또는 RESEND_API_KEY를 등록해 주세요.",
    };
  }
  return { sent: false, mode: "dev-log" };
}

/** Resend 제한(테스트 도메인 등)을 관리자 UI용 한국어로 변환 */
function friendlyResendError(msg: string): string {
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

/**
 * 국내 SMS 발송 핸들러 스텁 — 실제 발송 연동이 아직 없어 항상 sent:false를 반환한다.
 * (예전엔 SMS_API_KEY가 있으면 아무 발송도 안 하면서 "성공"인 것처럼 코드를
 * 인라인으로 돌려줘서, 전화번호 소유 증명 없이 인증을 통과할 수 있었다.)
 */
async function sendSmsOtp(phone: string, code: string): Promise<MailResult> {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP:sms:stub] ${phone} -> ${code}`);
    return { sent: false, mode: "dev-log" };
  }
  return {
    sent: false,
    mode: "none",
    error: "문자 인증은 아직 지원하지 않습니다. 이메일 인증을 이용해 주세요.",
  };
}
