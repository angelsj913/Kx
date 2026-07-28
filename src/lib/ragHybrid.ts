/** 하이브리드 RAG 점수 — 벡터 + BM25 스타일 키워드 (plan 021) */

import type { EvidenceItem } from "@/lib/ragWeb";

/** 벡터+키워드 하이브리드 점수 하한 — 미달 청크는 검색 결과에서 제외 */
export const MIN_RETRIEVAL_SCORE = Number(process.env.MIN_RETRIEVAL_SCORE ?? "0.35");

/** RAG 상위 결과가 이 값 미만이면 출처 카드·컨텍스트 주입을 생략 */
export const MIN_CITATION_SCORE = Number(process.env.MIN_CITATION_SCORE ?? "0.35");

const VECTOR_WEIGHT = 0.7;
const KEYWORD_WEIGHT = 0.3;

export function tokenize(query: string): string[] {
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

/** 0~1 키워드 겹침 점수 (하위 호환·골든·폴백) */
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

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * 후보 문서 집합에 대한 BM25 점수 (raw). 문서가 1개면 TF 위주로 동작.
 * 호출부가 `normalizeScores`로 0~1 스케일링한다.
 */
export function bm25RawScores(
  query: string,
  documents: string[],
  k1 = 1.2,
  b = 0.75,
): number[] {
  const qTerms = tokenizeWords(query);
  if (!qTerms.length || !documents.length) return documents.map(() => 0);

  const docs = documents.map((d) => tokenizeWords(d));
  const N = docs.length;
  const avgdl = docs.reduce((s, t) => s + t.length, 0) / N || 1;

  const df = new Map<string, number>();
  for (const term of new Set(qTerms)) {
    let c = 0;
    for (const doc of docs) {
      if (doc.includes(term)) c++;
    }
    df.set(term, c);
  }

  return docs.map((doc) => {
    const tf = new Map<string, number>();
    for (const w of doc) tf.set(w, (tf.get(w) ?? 0) + 1);
    let score = 0;
    for (const term of qTerms) {
      const f = tf.get(term) ?? 0;
      if (!f) continue;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const denom = f + k1 * (1 - b + (b * doc.length) / avgdl);
      score += idf * ((f * (k1 + 1)) / denom);
    }
    return score;
  });
}

export function normalizeScores(scores: number[]): number[] {
  const max = Math.max(0, ...scores);
  if (max <= 0) return scores.map(() => 0);
  return scores.map((s) => s / max);
}

/** 단일 문서 BM25 근사 — 코퍼스 없이 겹침 점수로 폴백 */
export function bm25Score(query: string, content: string, corpus?: string[]): number {
  if (corpus && corpus.length > 0) {
    const raw = bm25RawScores(query, corpus);
    const idx = corpus.indexOf(content);
    const norms = normalizeScores(raw);
    if (idx >= 0) return norms[idx] ?? 0;
  }
  return keywordOverlapScore(query, content);
}

export function hybridScore(vectorScore: number, keywordScore: number): number {
  return VECTOR_WEIGHT * vectorScore + KEYWORD_WEIGHT * keywordScore;
}

export function passesRetrievalThreshold(score: number): boolean {
  return score >= MIN_RETRIEVAL_SCORE;
}

export function splitSourcesByType(items: EvidenceItem[]) {
  return {
    web: items.filter((item) => item.sourceType === "web"),
    materials: items.filter((item) => item.sourceType !== "web"),
  };
}
