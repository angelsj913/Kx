import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { onPositiveFeedback } from "@/lib/userLearning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** AI 답변에 대한 👍👎 피드백 저장 (메시지당 1회) */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const chatHistoryId =
    typeof body?.chatHistoryId === "string" ? body.chatHistoryId : null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
  const toolId = typeof body?.toolId === "string" ? body.toolId : null;
  const rating = body?.rating;
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 2000) : null;

  if (!chatHistoryId) {
    return NextResponse.json({ error: "chatHistoryId가 필요합니다." }, { status: 400 });
  }
  if (rating !== 1 && rating !== -1) {
    return NextResponse.json({ error: "rating은 1 또는 -1이어야 합니다." }, { status: 400 });
  }

  const owned = await prisma.chatHistory.findFirst({
    where: { id: chatHistoryId, session: { userId: session.user.id } },
    select: { id: true, sessionId: true, agentId: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "메시지를 찾을 수 없습니다." }, { status: 404 });
  }

  const inferredToolId =
    toolId ??
    (owned.agentId?.startsWith("quicktool:")
      ? owned.agentId.replace("quicktool:", "")
      : null);

  const row = await prisma.answerFeedback.upsert({
    where: {
      userId_chatHistoryId: {
        userId: session.user.id,
        chatHistoryId,
      },
    },
    create: {
      userId: session.user.id,
      chatHistoryId,
      sessionId: sessionId ?? owned.sessionId,
      toolId: inferredToolId,
      rating,
      reason: reason || null,
    },
    update: {
      rating,
      reason: reason || null,
      toolId: inferredToolId,
    },
  });

  if (rating === 1) {
    const chatSession = sessionId
      ? await prisma.chatSession.findUnique({
          where: { id: sessionId },
          select: { workspaceId: true },
        })
      : null;
    void onPositiveFeedback({
      userId: session.user.id,
      chatHistoryId,
      workspaceId: chatSession?.workspaceId,
    }).catch((e) => console.warn("[feedback] learned QA save failed", e));
  }

  return NextResponse.json({ ok: true, feedback: row });
}

/** 특정 메시지들의 피드백 조회 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) {
    return NextResponse.json({ feedbacks: [] });
  }

  const feedbacks = await prisma.answerFeedback.findMany({
    where: { userId: session.user.id, chatHistoryId: { in: ids } },
    select: { chatHistoryId: true, rating: true, reason: true },
  });

  return NextResponse.json({ feedbacks });
}
