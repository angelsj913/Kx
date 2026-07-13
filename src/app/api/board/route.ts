import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveScope, WorkspaceError } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const scope = await resolveScope(request, session.user.id);
    const tasks = await prisma.workBoardTask.findMany({
      where: scope.workspaceId
        ? { workspaceId: scope.workspaceId }
        : { userId: session.user.id, workspaceId: null },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json({ tasks });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const title = String(body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }
  try {
    const scope = await resolveScope(request, session.user.id);
    const task = await prisma.workBoardTask.create({
      data: {
        userId: session.user.id,
        workspaceId: scope.workspaceId,
        title: title.slice(0, 200),
        description: body?.description ? String(body.description).slice(0, 4000) : null,
        status: ["todo", "doing", "done"].includes(body?.status) ? body.status : "todo",
        priority: ["low", "normal", "high"].includes(body?.priority) ? body.priority : "normal",
        dueAt: body?.dueAt ? new Date(body.dueAt) : null,
      },
    });
    return NextResponse.json({ task });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const existing = await prisma.workBoardTask.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body?.title === "string") data.title = body.title.trim().slice(0, 200);
  if (typeof body?.description === "string") data.description = body.description.slice(0, 4000);
  if (["todo", "doing", "done"].includes(body?.status)) data.status = body.status;
  if (["low", "normal", "high"].includes(body?.priority)) data.priority = body.priority;
  if (body?.dueAt === null) data.dueAt = null;
  else if (body?.dueAt) data.dueAt = new Date(body.dueAt);

  const task = await prisma.workBoardTask.update({ where: { id }, data });
  return NextResponse.json({ task });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const existing = await prisma.workBoardTask.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
  }
  await prisma.workBoardTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
