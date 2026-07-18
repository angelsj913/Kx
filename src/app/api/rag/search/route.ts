import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveScope, WorkspaceError } from "@/lib/workspace";
import { retrieveChunks } from "@/lib/ragSearch";
import { chatReplyWithFallback } from "@/lib/ai";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOP_K = 6;

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
    const { ranked, provider, empty } = await retrieveChunks({
      userId,
      workspaceId: scope.workspaceId,
      libraryItemId,
      query,
      k: TOP_K,
    });

    if (empty) {
      return NextResponse.json({
        answer: "아직 색인된 문서가 없어요. 먼저 서재 자료를 색인해 주세요.",
        sources: [],
        provider: "local",
      });
    }

    if (ranked.length === 0) {
      return NextResponse.json({ answer: "관련된 내용을 찾지 못했어요.", sources: [], provider });
    }

    const context = ranked
      .map((r) => `[${r.n}] (출처: ${r.title})\n${r.content}`)
      .join("\n\n");

    const result = await chatReplyWithFallback({
      systemInstruction: SYSTEM,
      messages: [{ role: "user", text: `질문: ${query}\n\n=== 컨텍스트 ===\n${context}` }],
    });

    const sources = ranked.map((r) => ({
      n: r.n,
      libraryItemId: r.libraryItemId,
      title: r.title,
      snippet: r.snippet,
      score: r.score,
    }));

    return NextResponse.json({ answer: result.text, sources, provider });
  } catch (err) {
    console.error("rag search error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
