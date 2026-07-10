import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 사이드바 "라이브러리" 목록: 최근 대화 세션들을 최신순으로 반환한다. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("list sessions error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
