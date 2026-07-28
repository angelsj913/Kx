import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { friendlyError } from "@/lib/errors";
import { BCRYPT_COST, checkPasswordStrength } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { assertRateLimit, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    await assertRateLimit("complete-password:user", session.user.id, {
      max: 8,
      windowSeconds: 3600,
    });

    const body = await request.json().catch(() => ({}));
    const password = String(body?.password ?? "");

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        passwordHash: true,
        accounts: {
          where: { provider: "google" },
          select: { provider: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (user.passwordHash) {
      return NextResponse.json(
        { error: "이미 비밀번호가 설정된 계정입니다." },
        { status: 409 },
      );
    }
    if (user.accounts.length === 0) {
      return NextResponse.json(
        { error: "구글 로그인으로 인증된 계정만 비밀번호를 설정할 수 있습니다." },
        { status: 403 },
      );
    }

    const strength = checkPasswordStrength(password, { email: user.email });
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("complete password error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
