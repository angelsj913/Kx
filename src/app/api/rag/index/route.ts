import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { itemAccessWhere } from "@/lib/workspace";
import { indexLibraryItem } from "@/lib/ragIndexing";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 서재 항목을 청크로 나눠 임베딩하고 색인한다(재색인 시 기존 청크 교체).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => ({}));
  const libraryItemId = String(body?.libraryItemId ?? "").trim();
  if (!libraryItemId) {
    return NextResponse.json({ error: "서재 항목을 선택해 주세요." }, { status: 400 });
  }

  const item = await prisma.libraryItem.findFirst({
    where: { id: libraryItemId, ...(await itemAccessWhere(userId)) },
  });
  if (!item) {
    return NextResponse.json({ error: "서재 항목을 찾을 수 없습니다." }, { status: 404 });
  }
  try {
    const result = await indexLibraryItem(item);
    if (!result) {
      return NextResponse.json(
        { error: "이 자료에서 추출된 텍스트가 없어 색인할 수 없어요." },
        { status: 400 },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("rag index error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
