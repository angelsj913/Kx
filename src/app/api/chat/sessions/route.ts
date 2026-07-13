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

  const sessions = await prisma.chatSession.findMany({
    where: listWhere(scope, session.user.id),
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({ sessions });
}

/** 빈 대화 세션 생성 — 첫 메시지 전에도 라이브러리(사이드바)에 표시 */
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
  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 80)
      : "새 대화";

  const chatSession = await prisma.chatSession.create({
    data: {
      userId,
      workspaceId: scope.workspaceId,
      title,
    },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({ session: chatSession }, { status: 201 });
}
