import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listWhere, resolveScope, WorkspaceError } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CARD_SELECT = {
  id: true,
  front: true,
  back: true,
  dueAt: true,
  repetitions: true,
  intervalDays: true,
  libraryItemId: true,
} as const;

// 복습 카드 목록 — 오늘 만기 카드(due) + 통계(total/due).
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let scope;
  try {
    scope = await resolveScope(request, session.user.id);
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const base = listWhere(scope, session.user.id);
  const now = new Date();

  const [due, total, dueCount] = await Promise.all([
    prisma.reviewCard.findMany({
      where: { ...base, dueAt: { lte: now } },
      orderBy: { dueAt: "asc" },
      take: 100,
      select: CARD_SELECT,
    }),
    prisma.reviewCard.count({ where: base }),
    prisma.reviewCard.count({ where: { ...base, dueAt: { lte: now } } }),
  ]);

  return NextResponse.json({ cards: due, stats: { total, due: dueCount } });
}

// 카드 생성 — 단일 { front, back } 또는 다중 { cards: [...] }. libraryItemId 선택.
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
  const libraryItemId =
    typeof body?.libraryItemId === "string" ? body.libraryItemId : null;

  const rawCards = Array.isArray(body?.cards)
    ? body.cards
    : [{ front: body?.front, back: body?.back }];

  const cards = rawCards
    .map((c: unknown) => {
      const rec = c as { front?: unknown; back?: unknown };
      return {
        front: String(rec?.front ?? "").trim(),
        back: String(rec?.back ?? "").trim(),
      };
    })
    .filter((c: { front: string; back: string }) => c.front && c.back)
    .slice(0, 200);

  if (cards.length === 0) {
    return NextResponse.json({ error: "앞/뒷면을 입력해 주세요." }, { status: 400 });
  }

  await prisma.reviewCard.createMany({
    data: cards.map((c: { front: string; back: string }) => ({
      userId,
      workspaceId: scope.workspaceId,
      libraryItemId,
      front: c.front,
      back: c.back,
    })),
  });

  return NextResponse.json({ created: cards.length });
}
