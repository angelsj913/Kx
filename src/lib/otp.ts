import { Resend } from "resend";
import { prisma } from "./prisma";

export type OtpChannel = "email" | "sms";
export type OtpPurpose = "signup" | "find-id" | "find-password";

const CODE_TTL_MS = 3 * 60 * 1000; // 3분

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** 6자리 코드를 발급·저장하고 채널로 발송한다. */
export async function issueOtp(
  identifier: string,
  channel: OtpChannel,
  purpose: OtpPurpose
): Promise<{ devCode?: string }> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  // 같은 대상·목적의 이전 미사용 코드는 정리
  await prisma.verificationCode.deleteMany({
    where: { identifier, purpose, consumedAt: null },
  });
  await prisma.verificationCode.create({
    data: { identifier, channel, purpose, code, expiresAt },
  });

  if (channel === "email") {
    await sendEmailOtp(identifier, code);
  } else {
    await sendSmsOtp(identifier, code);
  }

  // 프로덕션이 아니고 실제 발송 수단이 없으면 테스트용으로 코드를 반환
  const devCode =
    process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY ? code : undefined;
  return { devCode };
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

async function sendEmailOtp(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("이메일 인증이 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.");
    }
    console.log(`[OTP:email:dev] ${email} -> ${code}`);
    return;
  }
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM || "ZEFF AI <onboarding@resend.dev>";
  await resend.emails.send({
    from,
    to: email,
    subject: "[ZEFF AI] 인증번호",
    text: `ZEFF AI 인증번호는 ${code} 입니다. 3분 안에 입력해 주세요.`,
    html: `<div style="font-family:sans-serif;padding:24px"><p>ZEFF AI 인증번호</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p style="color:#64748b">3분 안에 입력해 주세요.</p></div>`,
  });
}

/** 국내 SMS 발송 핸들러 스터브 — 실제 연동(예: 솔라피/NHN Cloud) 시 이 함수만 구현하면 된다. */
async function sendSmsOtp(phone: string, code: string): Promise<void> {
  // TODO: 국내 SMS 게이트웨이 연동 지점. 현재는 스터브.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP:sms:stub] ${phone} -> ${code}`);
  }
  // 프로덕션에서 SMS 미구현 상태로 호출되면 안내
  if (process.env.NODE_ENV === "production" && !process.env.SMS_API_KEY) {
    throw new Error("문자 인증은 준비 중입니다. 이메일 인증을 이용해 주세요.");
  }
}
