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
    await assertRateLimit("signup:ip", clientIp(request), { max: 8, windowSeconds: 3600 });

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const name = String(body?.name ?? "").trim().slice(0, 60);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
    }

    const strength = checkPasswordStrength(password, { email });
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    // 이메일 OTP 인증이 최근에 완료됐는지 재확인 (프론트만 믿지 않음)
    const verified = await hasRecentVerifiedOtp(email, "signup");
    if (!verified) {
      return NextResponse.json({ error: "이메일 인증을 먼저 완료해 주세요." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        // 프로필 표시용 — 비어 있으면 UI가 이메일 앞부분으로 대신 표시한다.
        name: name || null,
        passwordHash,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("signup error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
