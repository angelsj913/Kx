import { prisma } from "./prisma";
import { sendMail, friendlyResendError } from "./mail";

// 이메일 전용(채널 개념 자체를 없앰) — 회원가입·비밀번호 재설정 이메일 인증과,
// 워크스페이스 삭제·관리자 요금제 변경 2단계 확인, 그리고 로그인 2단계 인증에 쓰인다.
export type OtpPurpose =
  | "signup"
  | "find-password"
  | "workspace-delete"
  | "admin-plan-change"
  | "login-2fa"
  | "password-change"
  | "admin-access";

const CODE_TTL_MS = 3 * 60 * 1000; // 3분

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export type IssueOtpResult = {
  /** 실제 발송 성공 여부 */
  sent: boolean;
  mode: "smtp" | "resend" | "dev-log" | "none";
  /** 개발 또는 메일 미설정/실패 시 화면에 보여줄 코드 (admin 폴백 포함) */
  devCode?: string;
  /** 발송 실패 사유 (있으면) */
  mailError?: string;
};

/** 6자리 코드를 발급·저장하고 이메일로 발송한다. */
export async function issueOtp(
  identifier: string,
  purpose: OtpPurpose
): Promise<IssueOtpResult> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  // 같은 대상·목적의 이전 미사용 코드는 정리
  await prisma.verificationCode.deleteMany({
    where: { identifier, purpose, consumedAt: null },
  });
  await prisma.verificationCode.create({
    data: { identifier, purpose, code, expiresAt },
  });

  const mail = await sendEmailOtp(identifier, code, purpose);

  // 메일이 안 나갔을 때: 개발 환경이거나 관리자 요금제 변경이면 코드를 응답에 포함
  // (운영에서 메일 키 미설정/Resend 제한으로 막혀도 관리 작업이 가능하도록)
  const allowInlineCode =
    !mail.sent &&
    (process.env.NODE_ENV !== "production" ||
      purpose === "admin-plan-change" ||
      purpose === "admin-access" ||
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

/**
 * 최근(30분 이내) 인증에 성공(소비)한 기록이 있는지 — 회원가입 최종 처리·비밀번호
 * 재설정 직전 재확인용. 이 함수가 false를 반환하는 이유는 "코드를 아예 발송한 적
 * 없음"(가입 안 된 이메일로 비번 재설정 시도 등)과 "인증을 아직 안 함"을 구분하지
 * 않는다 — 둘 다 같은 일반 메시지로 처리되게 해서, 계정 존재 여부가 이 단계에서
 * 새어나가지 않게 한다.
 */
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

function otpEmailHtml(code: string, title: string, message: string, admin = false): string {
  return `<div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:440px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px">
        <tr><td style="padding:28px 28px 12px">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.08em;color:#2563eb">ZEFF AI${admin ? " · ADMIN" : ""}</p>
          <h1 style="margin:8px 0 0;font-size:20px;line-height:1.35">${title}</h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#64748b">${message}</p>
        </td></tr>
        <tr><td style="padding:12px 28px 28px">
          <div style="border-radius:12px;background:#eff6ff;padding:18px;text-align:center;font-size:32px;font-weight:700;letter-spacing:7px;color:#1d4ed8">${code}</div>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">인증번호는 3분 동안 유효합니다. 요청하지 않았다면 이 메일을 무시하세요.</p>
        </td></tr>
      </table>
    </td></tr></table>
  </div>`;
}

async function sendEmailOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<MailResult> {
  const isAdminPlan = purpose === "admin-plan-change";
  const isAdminAccess = purpose === "admin-access";
  const is2fa = purpose === "login-2fa";
  const isPwChange = purpose === "password-change";
  const subject = isAdminPlan
    ? "[ZEFF AI] 관리자 · 요금제 변경 인증번호"
    : isAdminAccess
      ? "[ZEFF AI] 관리자 · 보안 콘솔 인증번호"
      : is2fa
      ? "[ZEFF AI] 로그인 2단계 인증번호"
      : isPwChange
        ? "[ZEFF AI] 비밀번호 변경 인증번호"
        : "[ZEFF AI] 인증번호";
  const text = isAdminPlan
    ? `ZEFF AI 관리자 요금제 변경 인증번호는 ${code} 입니다. 3분 안에 입력해 주세요. 본인이 요청하지 않았다면 무시하세요.`
    : isAdminAccess
      ? `ZEFF AI 관리자 보안 콘솔 인증번호는 ${code} 입니다. 3분 안에 입력해 주세요.`
      : is2fa
      ? `ZEFF AI 로그인 2단계 인증번호는 ${code} 입니다. 3분 안에 입력해 주세요. 본인이 로그인하지 않았다면 비밀번호를 변경해 주세요.`
      : isPwChange
        ? `ZEFF AI 비밀번호 변경 인증번호는 ${code} 입니다. 3분 안에 입력해 주세요. 본인이 요청하지 않았다면 즉시 비밀번호를 확인하고 이 메일을 무시하세요.`
        : `ZEFF AI 인증번호는 ${code} 입니다. 3분 안에 입력해 주세요.`;
  const html = otpEmailHtml(
    code,
    isAdminPlan
      ? "회원 요금제 변경 인증번호"
      : isAdminAccess
        ? "관리자 보안 콘솔 인증번호"
        : is2fa
        ? "로그인 2단계 인증번호"
        : isPwChange
          ? "비밀번호 변경 인증번호"
          : "인증번호",
    isAdminPlan
      ? "관리자 패널에서 요금제를 변경하려면 아래 번호를 입력하세요."
      : isAdminAccess
        ? "보안 콘솔에 접근하려면 아래 번호를 입력하세요."
        : is2fa
        ? "로그인을 계속하려면 아래 번호를 입력하세요."
        : isPwChange
          ? "비밀번호를 변경하려면 아래 번호를 입력하세요."
          : "ZEFF AI 인증을 완료하려면 아래 번호를 입력하세요.",
    isAdminPlan,
  );

  const result = await sendMail({ to: email, subject, text, html });
  if (result.sent) {
    return { sent: true, mode: result.mode === "none" ? "dev-log" : result.mode };
  }
  if (result.mode === "resend" && result.error) {
    return {
      sent: false,
      mode: "resend",
      error: friendlyResendError(result.error.replace(/^Resend 발송 실패: /, "")),
    };
  }
  if (process.env.NODE_ENV === "production") {
    return {
      sent: false,
      mode: "none",
      error:
        result.error ??
        "이메일 발송이 설정되지 않았습니다. Vercel에 SMTP_USER/SMTP_PASS 또는 RESEND_API_KEY를 등록해 주세요.",
    };
  }
  return { sent: false, mode: "dev-log" };
}
