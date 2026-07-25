import { NextResponse } from "next/server";
import { requireSecurityAdmin, logSecurityEvent } from "@/lib/security/program";
import { runSecurityAgent } from "@/lib/security/agentRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE = 4000;
const MAX_HISTORY = 20;

type HistoryItem = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const session = await requireSecurityAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as {
    message?: unknown;
    history?: unknown;
  };
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message가 필요합니다." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "메시지가 너무 깁니다." }, { status: 400 });
  }

  const history: HistoryItem[] = [];
  if (Array.isArray(raw.history)) {
    for (const item of raw.history.slice(-MAX_HISTORY)) {
      if (!item || typeof item !== "object") continue;
      const role = (item as HistoryItem).role;
      const content = (item as HistoryItem).content;
      if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
        history.push({ role, content: content.slice(0, MAX_MESSAGE) });
      }
    }
  }

  try {
    const result = await runSecurityAgent({ text: message, history });
    await logSecurityEvent("agent_chat", session.user.id, {
      refused: Boolean(result.refused),
      toolsUsed: result.toolsUsed,
      provider: result.provider || null,
      model: result.model || null,
    });
    return NextResponse.json({
      reply: result.text,
      toolsUsed: result.toolsUsed,
      provider: result.provider,
      model: result.model,
      refused: Boolean(result.refused),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "에이전트 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
