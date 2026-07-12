import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listWhere, resolveScope, WorkspaceError } from "@/lib/workspace";
import { topK } from "@/lib/rag";
import { embedQuery } from "@/lib/embeddings";
import { chatReplyWithFallback } from "@/lib/ai";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOP_K = 6;
const CANDIDATE_LIMIT = 2000;

const SYSTEM = `당신은 사내 문서 기반 질의응답 도우미입니다.
아래 제공된 발췌문(컨텍스트)만 근거로 답하세요.
규칙:
- 컨텍스트에 있는 내용만 사용하고, 없으면 "제공된 자료에서 답을 찾지 못했어요"라고 말합니다.
- 답변에 사용한 근거는 [1], [2]처럼 발췌문 번호로 표시합니다.
- 한국어로 간결하고 정확하게 답합니다.`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  let scope;
  try {
    scope = await resolveScope(request, userId);
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const body = await request.json().catch(() => ({}));
  const query = String(body?.query ?? "").trim();
  const libraryItemId =
    typeof body?.libraryItemId === "string" && body.libraryItemId
      ? body.libraryItemId
      : null;
  if (!query) {
    return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
  }

  try {
    const where = {
      ...listWhere(scope, userId),
      ...(libraryItemId ? { libraryItemId } : {}),
    };
    const chunks = await prisma.documentChunk.findMany({
      where,
      take: CANDIDATE_LIMIT,
      select: { id: true, content: true, embedding: true, libraryItemId: true },
    });

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "아직 색인된 문서가 없어요. 먼저 서재 자료를 색인해 주세요.",
        sources: [],
        provider: "local",
      });
    }

    const { vector, provider } = await embedQuery(query);
    const ranked = topK(vector, chunks, TOP_K).filter((r) => r.score > 0);

    if (ranked.length === 0) {
      return NextResponse.json({ answer: "관련된 내용을 찾지 못했어요.", sources: [], provider });
    }

    // 근거 문서 제목 조회
    const itemIds = [...new Set(ranked.map((r) => r.item.libraryItemId))];
    const items = await prisma.libraryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, title: true },
    });
    const titleOf = new Map(items.map((it) => [it.id, it.title]));

    const context = ranked
      .map((r, i) => `[${i + 1}] (출처: ${titleOf.get(r.item.libraryItemId) ?? "문서"})\n${r.item.content}`)
      .join("\n\n");

    const result = await chatReplyWithFallback({
      systemInstruction: SYSTEM,
      messages: [{ role: "user", text: `질문: ${query}\n\n=== 컨텍스트 ===\n${context}` }],
    });

    const sources = ranked.map((r, i) => ({
      n: i + 1,
      libraryItemId: r.item.libraryItemId,
      title: titleOf.get(r.item.libraryItemId) ?? "문서",
      snippet: r.item.content.slice(0, 200),
      score: Number(r.score.toFixed(3)),
    }));

    return NextResponse.json({ answer: result.text, sources, provider });
  } catch (err) {
    console.error("rag search error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
