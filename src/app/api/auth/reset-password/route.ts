import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hasRecentVerifiedOtp } from "@/lib/otp";
import { checkPasswordStrength } from "@/lib/password";
import { friendlyError } from "@/lib/errors";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await assertRateLimit("reset-password:ip", clientIp(request), { max: 10, windowSeconds: 600 });

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
    }

    const strength = checkPasswordStrength(password, { email });
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    // 계정이 없거나 비밀번호 로그인이 없는 경우도 여기서는 같은 일반 메시지로
    // 처리한다 — hasRecentVerifiedOtp가 두 경우 모두 false이므로, 이 단계에서
    // "그런 계정 없음"과 "인증을 아직 안 함"이 구분되지 않는다(계정 존재 여부가
    // 새어나가지 않게 하는 지점).
    const verified = await hasRecentVerifiedOtp(email, "find-password");
    if (!verified) {
      return NextResponse.json({ error: "이메일 인증을 먼저 완료해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "이메일 인증을 먼저 완료해 주세요." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("reset-password error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
