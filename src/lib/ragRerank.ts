/**
 * RAG LLM rerank — hybrid top-N 후보를 질문 관련도로 재정렬.
 * 실패·타임아웃·키 없음이면 입력 순서를 그대로 반환(fail-open).
 */
import { chatReplyWithFallback } from "@/lib/ai";
import { FALLBACK_MODELS, type ModelDef } from "@/lib/models";
import type { RankedChunk } from "@/lib/ragSearch";

export const RAG_RERANK_POOL = Number(process.env.RAG_RERANK_POOL ?? "20");

/** `RAG_RERANK=0` 이면 비활성. 기본 활성. */
export function isRagRerankEnabled(): boolean {
  const v = (process.env.RAG_RERANK ?? "1").trim().toLowerCase();
  return !(v === "0" || v === "false" || v === "off");
}

const RERANK_SYSTEM = `You rerank retrieval snippets for relevance to a user query.
Reply with ONLY a JSON array of 1-based indices in best-first order, e.g. [3,1,5].
Include each index at most once. No markdown, no explanation.`;

/** 모델 응답에서 1-based 인덱스 순서를 파싱. 유효하지 않으면 null. */
export function parseRerankOrder(raw: string, candidateCount: number): number[] | null {
  if (!raw || candidateCount <= 0) return null;
  const trimmed = raw.trim();
  const bracket = trimmed.match(/\[[\s\S]*?\]/);
  const jsonText = bracket?.[0] ?? trimmed;
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // "3,1,5" / "3 1 5"
    const nums = trimmed.match(/\d+/g)?.map((n) => Number(n)) ?? [];
    parsed = nums;
  }
  if (!Array.isArray(parsed)) return null;
  const seen = new Set<number>();
  const order: number[] = [];
  for (const item of parsed) {
    const n = typeof item === "number" ? item : Number(item);
    if (!Number.isInteger(n) || n < 1 || n > candidateCount) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    order.push(n);
  }
  return order.length ? order : null;
}

function cheapRerankCandidates(): ModelDef[] {
  const cheap = FALLBACK_MODELS.filter((m) => m.cheap || m.free);
  return (cheap.length ? cheap : FALLBACK_MODELS).slice(0, 3);
}

function buildUserPrompt(query: string, candidates: RankedChunk[]): string {
  const lines = candidates.map((c, i) => {
    const body = c.content.replace(/\s+/g, " ").slice(0, 280);
    return `[${i + 1}] (${c.title}) ${body}`;
  });
  return [`Query: ${query}`, "", "Candidates:", ...lines].join("\n");
}

/**
 * hybrid 정렬된 후보를 LLM으로 재정렬해 topK개 반환.
 * 후보가 topK 이하면 그대로 반환.
 */
export async function rerankChunks(args: {
  query: string;
  candidates: RankedChunk[];
  topK: number;
}): Promise<RankedChunk[]> {
  const { query, candidates, topK } = args;
  if (!candidates.length || topK <= 0) return [];
  if (candidates.length <= topK || !isRagRerankEnabled()) {
    return candidates.slice(0, topK).map((c, i) => ({ ...c, n: i + 1 }));
  }

  const pool = candidates.slice(0, Math.max(topK, RAG_RERANK_POOL));
  try {
    const result = await chatReplyWithFallback({
      systemInstruction: RERANK_SYSTEM,
      messages: [{ role: "user", text: buildUserPrompt(query, pool) }],
      candidates: cheapRerankCandidates(),
      modelTier: "standard",
    });
    const order = parseRerankOrder(result.text, pool.length);
    if (!order) {
      return pool.slice(0, topK).map((c, i) => ({ ...c, n: i + 1 }));
    }
    const picked: RankedChunk[] = [];
    const used = new Set<number>();
    for (const idx1 of order) {
      if (picked.length >= topK) break;
      const c = pool[idx1 - 1];
      if (!c || used.has(idx1)) continue;
      used.add(idx1);
      picked.push(c);
    }
    for (let i = 0; i < pool.length && picked.length < topK; i++) {
      if (used.has(i + 1)) continue;
      picked.push(pool[i]!);
    }
    return picked.map((c, i) => ({ ...c, n: i + 1 }));
  } catch (err) {
    console.warn("[ragRerank] skipped:", err instanceof Error ? err.message : err);
    return pool.slice(0, topK).map((c, i) => ({ ...c, n: i + 1 }));
  }
}
