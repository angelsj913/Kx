import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMembership, resolveScope, WorkspaceError } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSIGNEE_SELECT = { id: true, name: true, email: true, image: true } as const;

/** 팀 워크스페이스 작업은 어느 멤버든 이동/삭제/수정할 수 있고, 개인 작업은 만든 사람만 가능하다. */
async function findEditableTask(id: string, userId: string) {
  const task = await prisma.workBoardTask.findUnique({ where: { id } });
  if (!task) return null;
  if (task.workspaceId) {
    const membership = await getMembership(task.workspaceId, userId);
    return membership ? task : null;
  }
  return task.userId === userId ? task : null;
}

/** assigneeId가 지정되면 해당 워크스페이스의 실제 멤버인지 검증한다(개인 작업엔 담당자 없음). */
async function resolveAssigneeId(
  workspaceId: string | null,
  rawAssigneeId: unknown,
): Promise<string | null | undefined> {
  if (rawAssigneeId === null) return null;
  if (typeof rawAssigneeId !== "string" || !rawAssigneeId) return undefined;
  if (!workspaceId) return null;
  const membership = await getMembership(workspaceId, rawAssigneeId);
  return membership ? rawAssigneeId : undefined;
}

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
      include: { assignee: { select: ASSIGNEE_SELECT } },
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
    const assigneeId = await resolveAssigneeId(scope.workspaceId, body?.assigneeId);
    const task = await prisma.workBoardTask.create({
      data: {
        userId: session.user.id,
        workspaceId: scope.workspaceId,
        assigneeId: assigneeId ?? null,
        title: title.slice(0, 200),
        description: body?.description ? String(body.description).slice(0, 4000) : null,
        status: ["todo", "doing", "done"].includes(body?.status) ? body.status : "todo",
        priority: ["low", "normal", "high"].includes(body?.priority) ? body.priority : "normal",
        dueAt: body?.dueAt ? new Date(body.dueAt) : null,
      },
      include: { assignee: { select: ASSIGNEE_SELECT } },
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

  const existing = await findEditableTask(id, session.user.id);
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
  if ("assigneeId" in (body ?? {})) {
    const assigneeId = await resolveAssigneeId(existing.workspaceId, body.assigneeId);
    if (assigneeId !== undefined) data.assigneeId = assigneeId;
  }

  const task = await prisma.workBoardTask.update({
    where: { id },
    data,
    include: { assignee: { select: ASSIGNEE_SELECT } },
  });
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

  const existing = await findEditableTask(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
  }
  await prisma.workBoardTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
