import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueOtp, verifyOtp, type OtpChannel, type OtpPurpose } from "@/lib/otp";
import { friendlyError } from "@/lib/errors";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SMS는 아직 실제 발송 연동이 없다(sendSmsOtp는 스텁) — "email"만 실제로 지원하는
// 채널이다. sms를 허용해 두면 클라이언트가 채널만 바꿔 인증번호 자체 노출 경로를
// 열 수 있어(운영 게이트가 이메일 경로에만 있었음) 아예 입구에서 막는다.
const CHANNELS: OtpChannel[] = ["email"];
const PURPOSES: OtpPurpose[] = ["signup", "find-id", "find-password"];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const identifier = String(body?.identifier ?? "").trim();
    const channel = (body?.channel as OtpChannel) ?? "email";
    const purpose = (body?.purpose as OtpPurpose) ?? "signup";

    if (!identifier) {
      return NextResponse.json({ error: "대상을 입력해 주세요." }, { status: 400 });
    }
    if (!CHANNELS.includes(channel) || !PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const ip = clientIp(request);

    if (action === "send") {
      // 발송 스팸/대상 훑기 방지
      await assertRateLimit("otp:send:ip", ip, { max: 10, windowSeconds: 600 });
      await assertRateLimit(`otp:send:${purpose}`, identifier, { max: 4, windowSeconds: 600 });

      // 회원가입은 이미 가입된 이메일이면 차단
      if (purpose === "signup") {
        const existing = await prisma.user.findUnique({ where: { email: identifier } });
        if (existing) {
          return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
        }
      }
      // 아이디/비번 찾기는 가입된 이메일이어야 함
      if (purpose === "find-id" || purpose === "find-password") {
        const existing = await prisma.user.findUnique({ where: { email: identifier } });
        if (!existing) {
          return NextResponse.json({ error: "가입된 계정을 찾을 수 없습니다." }, { status: 404 });
        }
      }
      const { devCode } = await issueOtp(identifier, channel, purpose);
      return NextResponse.json({ ok: true, devCode });
    }

    if (action === "check") {
      const code = String(body?.code ?? "").trim();
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "6자리 숫자를 입력해 주세요." }, { status: 400 });
      }
      // 6자리(100만 가지) 무차별 대입 방어의 핵심 지점 — 코드 유효기간(3분) 안에
      // 시도 가능한 횟수를 사람이 실제로 틀릴 수 있는 수준으로 강하게 제한한다.
      // 대상(identifier+purpose) 기준과, 한 IP가 여러 대상을 훑는 것을 막는
      // IP 기준을 동시에 건다.
      await assertRateLimit(`otp:check:${purpose}`, identifier, { max: 8, windowSeconds: 180 });
      await assertRateLimit("otp:check:ip", ip, { max: 30, windowSeconds: 300 });
      const ok = await verifyOtp(identifier, purpose, code);
      if (!ok) {
        return NextResponse.json({ error: "인증번호가 올바르지 않거나 만료되었습니다." }, { status: 400 });
      }
      // 아이디 찾기: 인증에 성공하면 해당 이메일 계정의 아이디를 반환한다.
      if (purpose === "find-id") {
        const user = await prisma.user.findUnique({
          where: { email: identifier.toLowerCase() },
          select: { username: true },
        });
        return NextResponse.json({ ok: true, username: user?.username ?? null });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "알 수 없는 요청입니다." }, { status: 400 });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("verify error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
