import { prisma } from "@/lib/prisma";
import { embedQuery } from "@/lib/embeddings";
import { cosine } from "@/lib/rag";

export interface LearnedContext {
  qaPairs: { question: string; answer: string; score: number }[];
  profileHints: string[];
}

/** 피드백 집계 → UserAiProfile 업데이트 */
export async function aggregateFeedbackForUser(userId: string): Promise<void> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const feedbacks = await prisma.answerFeedback.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { toolId: true, rating: true, reason: true },
  });
  if (!feedbacks.length) return;

  const toolCounts = new Map<string, number>();
  const badPatterns: string[] = [];
  for (const f of feedbacks) {
    if (f.toolId) toolCounts.set(f.toolId, (toolCounts.get(f.toolId) ?? 0) + 1);
    if (f.rating === -1 && f.reason?.trim()) {
      badPatterns.push(f.reason.trim().slice(0, 200));
    }
  }

  const commonToolIds = [...toolCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const negativePatterns =
    badPatterns.length > 0
      ? { recent: [...new Set(badPatterns)].slice(0, 10) }
      : undefined;

  await prisma.userAiProfile.upsert({
    where: { userId },
    create: {
      userId,
      commonToolIds,
      negativePatterns: negativePatterns ?? undefined,
    },
    update: {
      commonToolIds,
      negativePatterns: negativePatterns ?? undefined,
    },
  });
}

/** thumbs-up Q&A를 LearnedQaPair에 저장 */
export async function saveLearnedQaPair(input: {
  userId: string;
  workspaceId?: string | null;
  question: string;
  answer: string;
  source: "thumbs_up" | "user_corrected";
}): Promise<void> {
  const q = input.question.trim();
  const a = input.answer.trim();
  if (!q || !a || a.length < 20) return;

  const { vector } = await embedQuery(q);
  await prisma.learnedQaPair.create({
    data: {
      userId: input.userId,
      workspaceId: input.workspaceId ?? null,
      question: q,
      answer: a,
      source: input.source,
      embedding: vector,
    },
  });
}

/** 유사 질문 시 few-shot 주입용 컨텍스트 */
export async function retrieveLearnedContext(input: {
  userId: string;
  query: string;
  k?: number;
}): Promise<LearnedContext> {
  const k = input.k ?? 2;
  const profile = await prisma.userAiProfile.findUnique({ where: { userId: input.userId } });
  const hints: string[] = [];

  if (profile?.preferredTone) {
    hints.push(`선호 톤: ${profile.preferredTone}`);
  }
  if (profile?.negativePatterns && typeof profile.negativePatterns === "object") {
    const recent = (profile.negativePatterns as { recent?: string[] }).recent;
    if (recent?.length) {
      hints.push(`피드백에서 피할 패턴: ${recent.slice(0, 3).join("; ")}`);
    }
  }

  const pairs = await prisma.learnedQaPair.findMany({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { question: true, answer: true, embedding: true },
  });

  if (!pairs.length) return { qaPairs: [], profileHints: hints };

  const { vector } = await embedQuery(input.query);
  const ranked = pairs
    .map((p) => ({
      question: p.question,
      answer: p.answer,
      score: cosine(vector, p.embedding),
    }))
    .filter((r) => r.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return { qaPairs: ranked, profileHints: hints };
}

/** 런타임 프롬프트에 학습 컨텍스트 주입 */
export function formatLearnedInstruction(ctx: LearnedContext): string {
  const parts: string[] = [];
  if (ctx.profileHints.length) {
    parts.push(`[사용자 선호]\n${ctx.profileHints.join("\n")}`);
  }
  if (ctx.qaPairs.length) {
    const examples = ctx.qaPairs
      .map(
        (p, i) =>
          `예시 ${i + 1} (유사도 ${p.score.toFixed(2)})\nQ: ${p.question.slice(0, 300)}\nA: ${p.answer.slice(0, 600)}`,
      )
      .join("\n\n");
    parts.push(`[과거 좋은 답변 참고 — 형식만 참고, 날조 금지]\n${examples}`);
  }
  return parts.join("\n\n");
}

/** 👍 피드백 시 Q&A 학습 저장 (비동기, 실패 무시) */
export async function onPositiveFeedback(input: {
  userId: string;
  chatHistoryId: string;
  workspaceId?: string | null;
}): Promise<void> {
  const msg = await prisma.chatHistory.findUnique({
    where: { id: input.chatHistoryId },
    select: { text: true, role: true, sessionId: true, createdAt: true },
  });
  if (!msg || msg.role !== "model") return;

  const priorUser = await prisma.chatHistory.findFirst({
    where: {
      sessionId: msg.sessionId,
      role: "user",
      createdAt: { lt: msg.createdAt },
    },
    orderBy: { createdAt: "desc" },
    select: { text: true },
  });
  if (!priorUser?.text) return;

  await saveLearnedQaPair({
    userId: input.userId,
    workspaceId: input.workspaceId,
    question: priorUser.text,
    answer: msg.text,
    source: "thumbs_up",
  });
}
