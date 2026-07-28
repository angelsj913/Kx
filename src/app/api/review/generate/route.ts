import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { itemAccessWhere, resolveScope, WorkspaceError } from "@/lib/workspace";
import { chatReplyWithFallback } from "@/lib/ai";
import { friendlyError } from "@/lib/errors";
import { assertAndConsumeQuota, refundQuota, QuotaError } from "@/lib/usage";
import { assertRateLimit, RateLimitError } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `당신은 학습 복습 카드(플래시카드) 생성기입니다.
주어진 학습 자료에서 핵심 개념을 뽑아 복습용 질문/답변 카드를 만듭니다.
규칙:
- 반드시 순수 JSON 배열만 출력합니다. 코드펜스나 설명 문장을 넣지 마세요.
- 각 원소는 {"front": "질문", "back": "간결한 정답"} 형식입니다.
- front는 한 가지 개념을 묻는 명확한 질문, back은 핵심만 담은 짧은 답.
- 자료의 언어(대개 한국어)를 그대로 사용합니다.`;

interface RawCard {
  front?: unknown;
  back?: unknown;
}

// 모델 출력에서 JSON 배열을 최대한 견고하게 파싱한다.
function parseCards(text: string): { front: string; back: string }[] {
  let candidate = text.trim();
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidate = fence[1].trim();
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start !== -1 && end > start) candidate = candidate.slice(start, end + 1);

  let arr: unknown;
  try {
    arr = JSON.parse(candidate);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((c) => {
      const rec = c as RawCard;
      return { front: String(rec?.front ?? "").trim(), back: String(rec?.back ?? "").trim() };
    })
    .filter((c) => c.front && c.back);
}

// 서재 항목에서 AI로 복습 카드를 자동 생성한다.
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

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
  const libraryItemId = String(body?.libraryItemId ?? "").trim();
  const count = Math.min(Math.max(Number(body?.count) || 10, 3), 30);
  if (!libraryItemId) {
    return NextResponse.json({ error: "서재 항목을 선택해 주세요." }, { status: 400 });
  }

  let quota: Awaited<ReturnType<typeof assertAndConsumeQuota>> | null = null;
  try {
    await assertRateLimit(`review:generate:${userId}`, userId, {
      max: 20,
      windowSeconds: 3600,
    });
    quota = await assertAndConsumeQuota(userId, null);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof QuotaError) {
      return NextResponse.json({ error: err.message, code: "QUOTA" }, { status: 402 });
    }
    throw err;
  }

  const item = await prisma.libraryItem.findFirst({
    where: { id: libraryItemId, ...(await itemAccessWhere(userId)) },
  });
  if (!item) {
    if (quota?.consumed) await refundQuota(userId, quota.consumed.feature, quota.consumed.periodKey);
    return NextResponse.json({ error: "서재 항목을 찾을 수 없습니다." }, { status: 404 });
  }
  const source = (item.extractedText ?? "").trim();
  if (!source) {
    if (quota?.consumed) await refundQuota(userId, quota.consumed.feature, quota.consumed.periodKey);
    return NextResponse.json(
      { error: "이 자료에서 추출된 텍스트가 없어 카드를 만들 수 없어요." },
      { status: 400 },
    );
  }

  // 색인된 청크가 있으면 RAG로 핵심 구간을 고르고, 없으면 기존 8k 슬라이스 폴백
  let material = source.slice(0, 8000);
  try {
    const { retrieveChunks } = await import("@/lib/ragSearch");
    const { isRagRerankEnabled } = await import("@/lib/ragRerank");
    const found = await retrieveChunks({
      userId,
      workspaceId: scope.workspaceId ?? null,
      libraryItemId,
      query: `${item.title}\n핵심 개념 복습`,
      k: 8,
      rerank: isRagRerankEnabled(),
    });
    if (!found.empty && found.ranked.length) {
      material = found.ranked.map((c) => c.content).join("\n\n").slice(0, 8000);
    }
  } catch (err) {
    console.warn("[review/generate] RAG assemble skipped:", err);
  }

  try {
    const result = await chatReplyWithFallback({
      systemInstruction: SYSTEM,
      messages: [
        {
          role: "user",
          text: `다음 자료로 복습 카드 ${count}개를 JSON 배열로 만들어 주세요.\n\n---\n${material}`,
        },
      ],
    });

    const parsed = parseCards(result.text).slice(0, count);
    if (parsed.length === 0) {
      if (quota?.consumed) await refundQuota(userId, quota.consumed.feature, quota.consumed.periodKey);
      return NextResponse.json(
        { error: "카드를 생성하지 못했어요. 잠시 후 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    await prisma.reviewCard.createMany({
      data: parsed.map((c) => ({
        userId,
        workspaceId: scope.workspaceId,
        libraryItemId: item.id,
        front: c.front,
        back: c.back,
      })),
    });

    return NextResponse.json({ created: parsed.length });
  } catch (err) {
    if (quota?.consumed) await refundQuota(userId, quota.consumed.feature, quota.consumed.periodKey);
    console.error("review generate error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
