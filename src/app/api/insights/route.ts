import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { itemAccessWhere, resolveScope, WorkspaceError } from "@/lib/workspace";
import { chatReplyWithFallback } from "@/lib/ai";
import { getPlanOrFree } from "@/lib/plans";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSIGHT_SYSTEM =
  "너는 문서를 읽고 핵심을 뽑아내는 분석가다. 주어진 문서를 바탕으로 요약과 핵심 포인트를 만든다. " +
  "설명이나 코드펜스 없이 순수 JSON 객체 하나만 출력한다. 형식: " +
  '{"title":"문서를 대표하는 짧은 제목","summary":"3~5문장 요약","keyPoints":["핵심 포인트 1","핵심 포인트 2","..."]}. ' +
  "keyPoints는 3~6개, 각 항목은 한 문장으로 구체적으로. 제목·요약·포인트는 문서와 같은 언어로 작성한다.";

interface ParsedInsight {
  title: string;
  summary: string;
  keyPoints: string[];
}

/** 모델 응답(JSON 문자열)을 견고하게 파싱한다(코드펜스·앞뒤 잡텍스트 제거). */
function parseInsight(raw: string): ParsedInsight | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  try {
    const obj = JSON.parse(text) as Record<string, unknown>;
    const title = String(obj.title ?? "").trim().slice(0, 200);
    const summary = String(obj.summary ?? "").trim();
    const keyPoints = Array.isArray(obj.keyPoints)
      ? obj.keyPoints.map((k) => String(k).trim()).filter(Boolean).slice(0, 8)
      : [];
    if (!summary && keyPoints.length === 0) return null;
    return { title, summary, keyPoints };
  } catch {
    return null;
  }
}

const CARD_SELECT = {
  id: true,
  title: true,
  summary: true,
  keyPoints: true,
  sourceName: true,
  libraryItemId: true,
  pinned: true,
  createdAt: true,
} as const;

/** 인사이트 카드 목록(고정 먼저, 그다음 최신순). */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const scope = await resolveScope(request, session.user.id);
    const cards = await prisma.savedInsight.findMany({
      where: scope.workspaceId
        ? { workspaceId: scope.workspaceId }
        : { userId: session.user.id, workspaceId: null },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      select: CARD_SELECT,
    });
    return NextResponse.json({ insights: cards });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("insights list error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

/** 서재 항목 하나를 골라 AI 요약·핵심포인트 인사이트 카드를 생성한다. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await request.json().catch(() => ({}));
  const libraryItemId = String(body?.libraryItemId ?? "").trim();
  if (!libraryItemId) {
    return NextResponse.json({ error: "요약할 자료를 선택해 주세요." }, { status: 400 });
  }

  try {
    const scope = await resolveScope(request, userId);
    const item = await prisma.libraryItem.findFirst({
      where: { id: libraryItemId, ...(await itemAccessWhere(userId)) },
    });
    if (!item) {
      return NextResponse.json({ error: "자료를 찾을 수 없습니다." }, { status: 404 });
    }

    const text = (item.extractedText ?? "").trim();
    if (!text) {
      return NextResponse.json(
        {
          error:
            "이 자료에서 읽어낼 텍스트가 없어요. 지식 베이스에서 먼저 색인(재분석)한 뒤 다시 시도해 주세요.",
        },
        { status: 400 },
      );
    }

    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    const plan = getPlanOrFree(settings?.plan);

    // 토큰 폭주 방지 — 앞부분 위주로 잘라 넣는다(요약은 전체 맥락보다 앞·중반이 핵심).
    const excerpt = text.slice(0, 12000);
    const reply = await chatReplyWithFallback({
      systemInstruction: INSIGHT_SYSTEM,
      modelTier: plan.modelTier,
      messages: [
        {
          role: "user",
          text: `제목: ${item.title}\n\n[문서 내용]\n${excerpt}\n\n위 문서를 요약하고 핵심 포인트를 뽑아 줘.`,
        },
      ],
    });

    const parsed = parseInsight(reply.text);
    if (!parsed) {
      return NextResponse.json(
        { error: "요약을 만들지 못했어요. 잠시 후 다시 시도해 주세요." },
        { status: 422 },
      );
    }

    const card = await prisma.savedInsight.create({
      data: {
        userId,
        workspaceId: scope.workspaceId,
        libraryItemId: item.id,
        sourceName: item.title,
        title: parsed.title || item.title,
        summary: parsed.summary,
        keyPoints: JSON.stringify(parsed.keyPoints),
      },
      select: CARD_SELECT,
    });
    return NextResponse.json({ insight: card });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("insight generate error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

/** 카드 고정/해제 토글. */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const existing = await prisma.savedInsight.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, pinned: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }
  const pinned =
    typeof body?.pinned === "boolean" ? body.pinned : !existing.pinned;
  const card = await prisma.savedInsight.update({
    where: { id },
    data: { pinned },
    select: CARD_SELECT,
  });
  return NextResponse.json({ insight: card });
}

/** 카드 삭제. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const existing = await prisma.savedInsight.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }
  await prisma.savedInsight.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
