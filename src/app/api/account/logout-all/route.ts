import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 모든 기기에서 로그아웃 — sessionVersion을 올려 이전에 발급된 모든 JWT를 무효화한다.
 * JWT 전략이라 현재 세션도 함께 무효화되므로, 클라이언트는 성공 후 로그인 페이지로 보낸다.
 */
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
  return NextResponse.json({ ok: true });
}
