// RAG 검색 유틸(순수 함수) — 청킹, 코사인 유사도, 상위 K 검색.

export interface Chunk {
  idx: number;
  content: string;
}

/**
 * 긴 텍스트를 겹침(overlap) 있는 청크로 나눈다.
 * 문단/문장 경계를 우선 살리되, 너무 길면 강제로 자른다.
 */
export function chunkText(text: string, size = 900, overlap = 150): Chunk[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (clean.length <= size) return [{ idx: 0, content: clean }];

  const chunks: Chunk[] = [];
  let start = 0;
  let idx = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    // 경계 살리기: 남은 게 더 있으면 마지막 문단/문장/공백에서 끊는다
    if (end < clean.length) {
      const slice = clean.slice(start, end);
      const brk = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf(". "),
      );
      if (brk > size * 0.5) end = start + brk + 1;
    }
    const content = clean.slice(start, end).trim();
    if (content) chunks.push({ idx: idx++, content });
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

/** 코사인 유사도(정규화된 벡터면 내적과 동일하지만, 안전하게 정규화 포함). */
export function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface Scored<T> {
  item: T;
  score: number;
}

/** 쿼리 벡터에 대해 상위 K개 항목을 유사도 내림차순으로 반환. */
export function topK<T extends { embedding: number[] }>(
  query: number[],
  items: T[],
  k: number,
): Scored<T>[] {
  return items
    .map((item) => ({ item, score: cosine(query, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
