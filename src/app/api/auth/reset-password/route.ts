import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hasRecentVerifiedOtp } from "@/lib/otp";
import { friendlyError } from "@/lib/errors";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rateLimit";
import { checkPasswordStrength } from "@/lib/password";

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

    const verified = await hasRecentVerifiedOtp(email, "find-password");
    if (!verified) {
      return NextResponse.json({ error: "이메일 인증을 먼저 완료해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "가입된 계정을 찾을 수 없습니다." }, { status: 404 });
    }

    const strength = checkPasswordStrength(password, { email, username: user.username });
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
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
