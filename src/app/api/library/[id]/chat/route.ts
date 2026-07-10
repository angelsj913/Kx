import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const item = await prisma.libraryItem.findFirst({ where: { id, userId } });
  if (!item) {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  }

  const chatSession = await prisma.chatSession.create({
    data: {
      userId,
      title: item.title,
      libraryItemId: item.id,
    },
  });

  await prisma.chatHistory.create({
    data: {
      sessionId: chatSession.id,
      role: "model",
      text:
        item.extractedText ||
        `「${item.title}」 문서를 아직 분석하지 못했어요. 그래도 궁금한 점을 편하게 물어보세요.`,
      agentId: "library:book-chat",
    },
  });

  return NextResponse.json({ sessionId: chatSession.id });
}
