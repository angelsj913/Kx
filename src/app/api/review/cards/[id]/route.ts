import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMembership, itemAccessWhere, roleAtLeast } from "@/lib/workspace";
import { dueDateFrom, schedule, type ReviewGrade } from "@/lib/srs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRADES: ReviewGrade[] = ["again", "hard", "good", "easy"];

// 카드 채점 → SM-2로 다음 만기 갱신.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const grade = body?.grade as ReviewGrade;
  if (!GRADES.includes(grade)) {
    return NextResponse.json({ error: "잘못된 채점 값입니다." }, { status: 400 });
  }

  const card = await prisma.reviewCard.findFirst({
    where: { id, ...(await itemAccessWhere(session.user.id)) },
  });
  if (!card) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }

  const next = schedule(
    { ease: card.ease, intervalDays: card.intervalDays, repetitions: card.repetitions },
    grade,
  );
  const now = new Date();

  const updated = await prisma.reviewCard.update({
    where: { id },
    data: {
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: dueDateFrom(next.dueInDays, now),
      lastReviewedAt: now,
    },
    select: { id: true, dueAt: true, intervalDays: true, repetitions: true },
  });

  return NextResponse.json({ card: updated });
}

// 카드 삭제 — 생성자 또는 공유 워크스페이스 admin 이상.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const card = await prisma.reviewCard.findFirst({
    where: { id, ...(await itemAccessWhere(userId)) },
  });
  if (!card) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }

  let canDelete = card.userId === userId;
  if (!canDelete && card.workspaceId) {
    const membership = await getMembership(card.workspaceId, userId);
    canDelete = roleAtLeast(membership?.role, "admin");
  }
  if (!canDelete) {
    return NextResponse.json({ error: "이 카드를 삭제할 권한이 없습니다." }, { status: 403 });
  }

  await prisma.reviewCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
