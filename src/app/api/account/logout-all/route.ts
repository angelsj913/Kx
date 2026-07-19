import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 모든 기기에서 로그아웃 — sessionVersion을 올려 이전에 발급된 모든 JWT를 무효화한다.
 * JWT 전략이라 현재 세션도 함께 무효화되므로, 클라이언트는 성공 후 로그인 페이지로 보낸다.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { sessionVersion: { increment: 1 } },
  });
  return NextResponse.json({ ok: true });
}
