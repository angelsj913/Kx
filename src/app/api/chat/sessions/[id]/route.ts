import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 라이브러리에서 과거 세션을 클릭했을 때, 그 세션의 대화 내역을 시간순으로 불러온다. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  try {
    const chatSession = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
      include: { history: { orderBy: { createdAt: "asc" } } },
    });
    if (!chatSession) {
      return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({
      id: chatSession.id,
      title: chatSession.title,
      history: chatSession.history.map((h) => ({
        id: h.id,
        message: h.message,
        reply: h.reply,
        createdAt: h.createdAt,
      })),
    });
  } catch (err) {
    console.error("get session error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

/** 라이브러리에서 세션을 삭제한다(연결된 대화 기록도 함께 삭제됨). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  try {
    const { count } = await prisma.chatSession.deleteMany({ where: { id, userId: session.user.id } });
    if (count === 0) {
      return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("delete session error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
