import { prisma } from "@/lib/prisma";
import { embedQuery } from "@/lib/embeddings";
import { cosine } from "@/lib/rag";

export interface LearnedContext {
  qaPairs: { question: string; answer: string; score: number }[];
  profileHints: string[];
  memories: string[];
}

const MEMORY_PATTERNS: { category: string; pattern: RegExp }[] = [
  {
    category: "preference",
    pattern:
      /(?:기억해|선호(?:해|합니다)?|좋아해|싫어해|항상|앞으로|prefer|remember|always|never|i like|i dislike)\s*[:,-]?\s*(.{4,180})/i,
  },
  {
    category: "fact",
    pattern:
      /(?:저는|나는|제 |내 |my |i am |i work|i study)\s+(.{4,180})/i,
  },
];

function normalizeMemory(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** 사용자 문장에서 명시적이고 재사용 가능한 장기 맥락만 보수적으로 저장한다. */
export async function learnFromUserMessage(input: {
  userId: string;
  sessionId: string;
  text: string;
}): Promise<void> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId: input.userId },
    select: { memoryEnabled: true },
  });
  if (settings?.memoryEnabled === false) return;

  const source = normalizeMemory(input.text);
  if (source.length < 8 || source.length > 500) return;
  const match = MEMORY_PATTERNS.map(({ category, pattern }) => {
    const found = source.match(pattern);
    return found ? { category, content: normalizeMemory(found[1] ?? source) } : null;
  }).find(Boolean);
  if (!match || match.content.length < 4) return;

  const duplicate = await prisma.userMemory.findFirst({
    where: { userId: input.userId, content: { equals: match.content, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) {
    await prisma.userMemory.update({ where: { id: duplicate.id }, data: { updatedAt: new Date() } });
    return;
  }
  await prisma.userMemory.create({
    data: {
      userId: input.userId,
      sourceSessionId: input.sessionId,
      content: match.content,
      category: match.category,
    },
  });
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
  const [profile, settings, memories] = await Promise.all([
    prisma.userAiProfile.findUnique({ where: { userId: input.userId } }),
    prisma.userSettings.findUnique({
      where: { userId: input.userId },
      select: { memoryEnabled: true, preferredTone: true },
    }),
    prisma.userMemory.findMany({
      where: { userId: input.userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { content: true },
    }),
  ]);
  const hints: string[] = [];

  const preferredTone = settings?.preferredTone || profile?.preferredTone;
  if (preferredTone && preferredTone !== "balanced") {
    hints.push(`선호 톤: ${preferredTone}`);
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

  const activeMemories = settings?.memoryEnabled === false ? [] : memories.map((memory) => memory.content);
  if (!pairs.length) return { qaPairs: [], profileHints: hints, memories: activeMemories };

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

  return { qaPairs: ranked, profileHints: hints, memories: activeMemories };
}

/** 런타임 프롬프트에 학습 컨텍스트 주입 */
export function formatLearnedInstruction(ctx: LearnedContext): string {
  const parts: string[] = [];
  if (ctx.profileHints.length) {
    parts.push(`[사용자 선호]\n${ctx.profileHints.join("\n")}`);
  }
  if (ctx.memories.length) {
    parts.push(
      `[사용자가 저장한 장기 맥락]\n${ctx.memories
        .slice(0, 8)
        .map((memory) => `- ${memory}`)
        .join("\n")}\n명시적으로 충돌하는 현재 요청이 있으면 현재 요청을 우선하세요.`,
    );
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
