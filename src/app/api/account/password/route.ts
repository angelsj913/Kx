import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkPasswordStrength } from "@/lib/password";
import { friendlyError } from "@/lib/errors";
import { assertRateLimit, RateLimitError } from "@/lib/rateLimit";
import { issueOtp, verifyOtp } from "@/lib/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 비밀번호 변경 (이메일 OTP 필수)
 * - step: "request" — 현재 비밀번호 확인 + OTP 발송
 * - step: "confirm" — OTP 검증 후 새 비밀번호 적용
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    await assertRateLimit("account-password:user", session.user.id, { max: 10, windowSeconds: 600 });

    const body = await request.json().catch(() => ({}));
    const step = String(body?.step ?? "confirm");
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");
    const code = String(body?.code ?? "").trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "현재 비밀번호와 새 비밀번호를 모두 입력해 주세요." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "이 계정은 비밀번호 로그인을 사용하지 않습니다(구글 로그인)." },
        { status: 400 },
      );
    }
    if (!user.email) {
      return NextResponse.json({ error: "이메일이 없는 계정입니다." }, { status: 400 });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
    }

    const strength = checkPasswordStrength(newPassword, { email: user.email });
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    if (step === "request") {
      await assertRateLimit("account-password-otp:user", session.user.id, {
        max: 5,
        windowSeconds: 600,
      });
      const result = await issueOtp(user.email, "password-change");
      return NextResponse.json({
        ok: true,
        otpSent: true,
        sent: result.sent,
        mode: result.mode,
        mailError: result.mailError,
        devCode: result.devCode,
      });
    }

    if (step !== "confirm") {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "이메일로 받은 6자리 인증번호를 입력해 주세요." }, { status: 400 });
    }

    const valid = await verifyOtp(user.email, "password-change", code);
    if (!valid) {
      return NextResponse.json(
        { error: "인증번호가 올바르지 않거나 만료되었습니다." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("account password change error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
