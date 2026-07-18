import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 로그인한 사용자가 자신의 문의 1건 상세(본문 + 관리자 답변)를 본다. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  const inquiry = await prisma.inquiry.findFirst({
    // 본인 문의만 — userId 로 소유권 확인
    where: { id, userId: session.user.id },
    select: {
      id: true,
      type: true,
      subject: true,
      body: true,
      status: true,
      reply: true,
      fileUrl: true,
      fileName: true,
      createdAt: true,
    },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ inquiry });
}
