import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 2단계 인증 켜기/끄기 — 이메일로 받은 코드 확인 후 반영(켜든 끄든 본인 확인 요구). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const enable = body?.enable === true;
  const code = String(body?.code ?? "").trim();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, passwordHash: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "이메일이 없는 계정입니다." }, { status: 400 });
  }
  // 2FA는 이메일/비밀번호 로그인 계정에만 의미가 있다(구글 로그인은 구글이 2FA 담당).
  if (enable && !user.passwordHash) {
    return NextResponse.json(
      { error: "구글 로그인 계정은 구글 계정에서 2단계 인증을 설정해 주세요." },
      { status: 400 }
    );
  }

  const ok = await verifyOtp(user.email, "login-2fa", code);
  if (!ok) {
    return NextResponse.json(
      { error: "인증번호가 올바르지 않거나 만료되었습니다." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: enable },
  });
  return NextResponse.json({ ok: true, twoFactorEnabled: enable });
}
