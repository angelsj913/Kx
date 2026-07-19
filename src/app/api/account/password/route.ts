import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkPasswordStrength } from "@/lib/password";
import { friendlyError } from "@/lib/errors";
import { assertRateLimit, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 로그인 상태에서 현재 비밀번호 확인 후 새 비밀번호로 변경. */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    await assertRateLimit("account-password:user", session.user.id, { max: 10, windowSeconds: 600 });

    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "이 계정은 비밀번호 로그인을 사용하지 않습니다(구글 로그인)." },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
    }

    const strength = checkPasswordStrength(newPassword, { email: user.email });
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    // 참고: 현재 세션을 유지하기 위해 여기서 sessionVersion을 올리지 않는다. 다른 기기를
    // 끊고 싶으면 "모든 기기에서 로그아웃"을 사용한다(logout-all).
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("account password change error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
