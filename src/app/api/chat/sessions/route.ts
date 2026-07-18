import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listWhere, resolveScope, WorkspaceError } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // 메시지 있는 실제 대화를 위에, 빈 「새 대화」는 아래로
  const rows = await prisma.chatSession.findMany({
    where: listWhere(scope, session.user.id),
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
      _count: { select: { history: true } },
    },
  });

  const withMessages = rows.filter((r) => r._count.history > 0);
  const emptyOnly = rows.filter((r) => r._count.history === 0);
  const ordered = [...withMessages, ...emptyOnly];

  const sessions = ordered.map(({ _count, ...s }) => ({
    ...s,
    messageCount: _count.history,
  }));

  return NextResponse.json({ sessions });
}

/** 새 대화 버튼으로만 호출 — 입장 시 자동 생성하지 않음 */
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
  // 제목이 없으면 null로 저장한다 — 번역된 placeholder 문자열을 데이터로 박아두지
  // 않아야, 첫 메시지가 왔을 때 "제목 없음" 여부를 언어에 상관없이 정확히 판단할 수
  // 있다(사이드바는 title이 비어 있으면 자동으로 번역된 placeholder를 보여준다).
  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 80)
      : null;

  const chatSession = await prisma.chatSession.create({
    data: {
      userId,
      workspaceId: scope.workspaceId,
      title,
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    { session: { ...chatSession, messageCount: 0 } },
    { status: 201 },
  );
}
