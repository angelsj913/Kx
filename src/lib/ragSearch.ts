import { prisma } from "@/lib/prisma";
import { listWhere } from "@/lib/workspace";
import { embedQuery } from "@/lib/embeddings";
import {
  bm25RawScores,
  hybridScore,
  normalizeScores,
  passesRetrievalThreshold,
} from "@/lib/ragHybrid";
import { cosine } from "@/lib/rag";
import { isRagRerankEnabled, RAG_RERANK_POOL, rerankChunks } from "@/lib/ragRerank";
import { expandQueries, isMultiQueryEnabled } from "@/lib/ragMultiQuery";

function cosineLocal(a: number[], b: number[]): number {
  return cosine(a, b);
}

/**
 * RAG 검색(검색만 — LLM 합성 없음).
 *
 * 점수: 벡터 + BM25(후보 집합) 하이브리드. 멀티쿼리 시 쿼리별 max 점수.
 * 게이트 통과 후 hybrid top-N을 LLM rerank(옵션).
 */
export const RAG_CANDIDATE_LIMIT = 2000;

export interface RankedChunk {
  n: number;
  libraryItemId: string;
  title: string;
  content: string;
  snippet: string;
  score: number;
}

export interface RetrieveResult {
  ranked: RankedChunk[];
  provider: string;
  /** 색인된 청크가 하나도 없을 때 */
  empty: boolean;
  /** LLM rerank 적용 여부 */
  reranked?: boolean;
  /** 멀티쿼리 확장 사용 여부 */
  multiQuery?: boolean;
}

export async function retrieveChunks(input: {
  userId: string;
  workspaceId?: string | null;
  libraryItemId?: string | null;
  /** 여러 서재 항목으로 검색 범위를 제한할 때 */
  libraryItemIds?: string[];
  query: string;
  k?: number;
  /** LLM 재정렬 (기본 false — 채팅 컨텍스트 경로에서만 켠다) */
  rerank?: boolean;
}): Promise<RetrieveResult> {
  const k = input.k ?? 6;
  const scopedIds =
    input.libraryItemIds?.filter(Boolean) ??
    (input.libraryItemId ? [input.libraryItemId] : []);
  const where = {
    ...listWhere({ workspaceId: input.workspaceId ?? null }, input.userId),
    ...(scopedIds.length === 1
      ? { libraryItemId: scopedIds[0] }
      : scopedIds.length > 1
        ? { libraryItemId: { in: scopedIds } }
        : {}),
  };

  const chunks = await prisma.documentChunk.findMany({
    where,
    take: RAG_CANDIDATE_LIMIT,
    select: { id: true, content: true, embedding: true, libraryItemId: true },
  });

  if (chunks.length === 0) {
    return { ranked: [], provider: "local", empty: true };
  }

  const queries = await expandQueries(input.query);
  const usedMulti = isMultiQueryEnabled() && queries.length > 1;
  const contents = chunks.map((c) => c.content);

  // chunkId → best hybrid score
  const best = new Map<string, { item: (typeof chunks)[number]; score: number }>();
  let provider = "local";

  for (const q of queries) {
    const embedded = await embedQuery(q);
    provider = embedded.provider;
    const bm25 = normalizeScores(bm25RawScores(q, contents));
    for (let i = 0; i < chunks.length; i++) {
      const item = chunks[i]!;
      const vectorScore = cosineLocal(embedded.vector, item.embedding);
      const score = hybridScore(vectorScore, bm25[i] ?? 0);
      const prev = best.get(item.id);
      if (!prev || score > prev.score) {
        best.set(item.id, { item, score });
      }
    }
  }

  const scored = [...best.values()]
    .filter((r) => passesRetrievalThreshold(r.score))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { ranked: [], provider, empty: false, multiQuery: usedMulti };
  }

  const poolSize = Math.max(k, RAG_RERANK_POOL);
  const pool = scored.slice(0, poolSize);

  const itemIds = [...new Set(pool.map((r) => r.item.libraryItemId))];
  const items = await prisma.libraryItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, title: true },
  });
  const titleOf = new Map(items.map((it) => [it.id, it.title]));

  const rankedPool: RankedChunk[] = pool.map((r, i) => ({
    n: i + 1,
    libraryItemId: r.item.libraryItemId,
    title: titleOf.get(r.item.libraryItemId) ?? "문서",
    content: r.item.content,
    snippet: r.item.content.slice(0, 200),
    score: Number(r.score.toFixed(3)),
  }));

  const wantRerank = input.rerank === true && isRagRerankEnabled();
  if (wantRerank && rankedPool.length > k) {
    const ranked = await rerankChunks({
      query: input.query,
      candidates: rankedPool,
      topK: k,
    });
    return { ranked, provider, empty: false, reranked: true, multiQuery: usedMulti };
  }

  return {
    ranked: rankedPool.slice(0, k).map((c, i) => ({ ...c, n: i + 1 })),
    provider,
    empty: false,
    reranked: false,
    multiQuery: usedMulti,
  };
}
