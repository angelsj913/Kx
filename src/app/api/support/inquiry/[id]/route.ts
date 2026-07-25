import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 로그인한 사용자가 자신의 문의 1건 상세(본문 + 관리자 답변)를 본다. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;
  const { id } = await params;

  const inquiry = await prisma.inquiry.findFirst({
    // 본인 문의만 — userId 로 소유권 확인
    where: { id, userId: userId },
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

  const { resolveInquiryFileUrl } = await import("@/lib/inquiryBlob");
  const fileUrl = await resolveInquiryFileUrl(inquiry.fileUrl);

  return NextResponse.json({ inquiry: { ...inquiry, fileUrl } });
}
