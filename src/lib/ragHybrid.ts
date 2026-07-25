/** 하이브리드 RAG 점수 — 벡터 + 한국어 키워드/바이그램 가중 합산 */

export const MIN_RETRIEVAL_SCORE = Number(process.env.MIN_RETRIEVAL_SCORE ?? "0.15");

const VECTOR_WEIGHT = 0.75;
const KEYWORD_WEIGHT = 0.25;

function tokenize(query: string): string[] {
  const cleaned = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();
  if (!cleaned) return [];

  const words = cleaned.split(/\s+/).filter((w) => w.length >= 2);
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return [...new Set([...words, ...bigrams])];
}

/** 0~1 키워드 겹침 점수 */
export function keywordOverlapScore(query: string, content: string): number {
  const tokens = tokenize(query);
  if (!tokens.length) return 0;
  const lower = content.toLowerCase();
  let hits = 0;
  for (const t of tokens) {
    if (lower.includes(t)) hits++;
  }
  return hits / tokens.length;
}

export function hybridScore(vectorScore: number, keywordScore: number): number {
  return VECTOR_WEIGHT * vectorScore + KEYWORD_WEIGHT * keywordScore;
}

export function passesRetrievalThreshold(score: number): boolean {
  return score >= MIN_RETRIEVAL_SCORE;
}
