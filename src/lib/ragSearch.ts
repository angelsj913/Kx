import { prisma } from "@/lib/prisma";
import { listWhere } from "@/lib/workspace";
import { embedQuery } from "@/lib/embeddings";
import {
  hybridScore,
  keywordOverlapScore,
  passesRetrievalThreshold,
} from "@/lib/ragHybrid";
import { cosine } from "@/lib/rag";

function cosineLocal(a: number[], b: number[]): number {
  return cosine(a, b);
}

/**
 * RAG 검색(검색만 — LLM 합성 없음). rag/search 라우트에 인라인돼 있던 로직을
 * HTTP와 무관하게 재사용 가능한 형태로 뽑아낸 것. 라우트와 에이전트 툴이 공용한다.
 *
 * 스코프: workspaceId가 주어지면 팀 자료, 없으면 개인 자료(userId). Request를 받지
 * 않으므로 호출부가 미리 멤버십/권한을 확인해야 한다(라우트의 auth + resolveScope,
 * 에이전트의 세션 workspaceId).
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
}

export async function retrieveChunks(input: {
  userId: string;
  workspaceId?: string | null;
  libraryItemId?: string | null;
  query: string;
  k?: number;
}): Promise<RetrieveResult> {
  const k = input.k ?? 6;
  const where = {
    ...listWhere({ workspaceId: input.workspaceId ?? null }, input.userId),
    ...(input.libraryItemId ? { libraryItemId: input.libraryItemId } : {}),
  };

  const chunks = await prisma.documentChunk.findMany({
    where,
    take: RAG_CANDIDATE_LIMIT,
    select: { id: true, content: true, embedding: true, libraryItemId: true },
  });

  if (chunks.length === 0) {
    return { ranked: [], provider: "local", empty: true };
  }

  const { vector, provider } = await embedQuery(input.query);
  const scored = chunks
    .map((item) => {
      const vectorScore = cosineLocal(vector, item.embedding);
      const kw = keywordOverlapScore(input.query, item.content);
      return { item, score: hybridScore(vectorScore, kw) };
    })
    .filter((r) => passesRetrievalThreshold(r.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  if (scored.length === 0) {
    return { ranked: [], provider, empty: false };
  }

  const top = scored;

  const itemIds = [...new Set(top.map((r) => r.item.libraryItemId))];
  const items = await prisma.libraryItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, title: true },
  });
  const titleOf = new Map(items.map((it) => [it.id, it.title]));

  const ranked: RankedChunk[] = top.map((r, i) => ({
    n: i + 1,
    libraryItemId: r.item.libraryItemId,
    title: titleOf.get(r.item.libraryItemId) ?? "문서",
    content: r.item.content,
    snippet: r.item.content.slice(0, 200),
    score: Number(r.score.toFixed(3)),
  }));

  return { ranked, provider, empty: false };
}
