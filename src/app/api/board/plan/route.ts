import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveScope, WorkspaceError } from "@/lib/workspace";
import { chatReplyWithFallback } from "@/lib/ai";
import { friendlyError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSIGNEE_SELECT = { id: true, name: true, email: true, image: true } as const;

const PLAN_SYSTEM =
  "너는 프로젝트 매니저다. 사용자가 목표를 입력하면 실행 가능한 하위 작업으로 분해한다. " +
  "설명 없이 순수 JSON 배열만 출력한다(코드펜스 금지). 형식: " +
  '[{"title":"작업 제목(간결·행동 중심)","priority":"low|normal|high","dueInDays":정수 또는 null}]. ' +
  "3~8개, 논리적 순서대로. 마감이 의미 있으면 dueInDays로 상대 일수를 제안하고, 없으면 null. " +
  "제목은 사용자가 쓴 언어와 같은 언어로 작성한다.";

interface PlanTask {
  title: string;
  priority: "low" | "normal" | "high";
  dueInDays: number | null;
}

function parsePlan(raw: string): PlanTask[] {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  let arr: unknown;
  try {
    arr = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: PlanTask[] = [];
  for (const item of arr.slice(0, 8)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = String(o.title ?? "").trim().slice(0, 200);
    if (!title) continue;
    const priority = ["low", "normal", "high"].includes(String(o.priority))
      ? (o.priority as PlanTask["priority"])
      : "normal";
    const dueRaw = o.dueInDays;
    const dueInDays =
      typeof dueRaw === "number" && Number.isFinite(dueRaw) && dueRaw >= 0
        ? Math.min(365, Math.round(dueRaw))
        : null;
    out.push({ title, priority, dueInDays });
  }
  return out;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const goal = String(body?.goal ?? "").trim();
  if (!goal) {
    return NextResponse.json({ error: "목표를 입력해 주세요." }, { status: 400 });
  }

  try {
    const scope = await resolveScope(request, session.user.id);

    const reply = await chatReplyWithFallback({
      systemInstruction: PLAN_SYSTEM,
      messages: [{ role: "user", text: `목표: ${goal}` }],
    });
    const plan = parsePlan(reply.text);
    if (plan.length === 0) {
      return NextResponse.json(
        { error: "작업을 만들지 못했어요. 목표를 조금 더 구체적으로 적어 주세요." },
        { status: 422 },
      );
    }

    const now = Date.now();
    const created = [];
    for (const p of plan) {
      const task = await prisma.workBoardTask.create({
        data: {
          userId: session.user.id,
          workspaceId: scope.workspaceId,
          title: p.title,
          status: "todo",
          priority: p.priority,
          dueAt: p.dueInDays != null ? new Date(now + p.dueInDays * 86400000) : null,
        },
        include: { assignee: { select: ASSIGNEE_SELECT } },
      });
      created.push(task);
    }
    return NextResponse.json({ tasks: created });
  } catch (err) {
    if (err instanceof WorkspaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("board plan error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
