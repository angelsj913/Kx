import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { itemAccessWhere } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 채팅 안에서 실행된 퀵툴(구조화 결과)의 인라인 편집 내용을 debounce 저장한다. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const result = typeof body?.result === "string" ? body.result : null;
  if (!result) {
    return NextResponse.json({ error: "저장할 내용이 없습니다." }, { status: 400 });
  }

  const { id } = await params;
  const access = await itemAccessWhere(session.user.id);
  const row = await prisma.chatHistory.findFirst({
    where: { id, session: access },
    select: { id: true },
  });
  if (!row) {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.chatHistory.update({
    where: { id: row.id },
    data: { resultData: result },
  });

  return NextResponse.json({ ok: true });
}
