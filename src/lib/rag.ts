// RAG 검색 유틸(순수 함수) — 시맨틱 청킹, 코사인 유사도.

export interface Chunk {
  idx: number;
  content: string;
}

/** ATX 헤더(`#`…`######`) 기준으로 섹션을 나눈다. 헤더가 없으면 원문 하나. */
export function splitByMarkdownHeaders(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: string[] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (/^#{1,6}\s+\S/.test(line) && buf.some((l) => l.trim())) {
      sections.push(buf.join("\n").trim());
      buf = [line];
    } else {
      buf.push(line);
    }
  }
  const last = buf.join("\n").trim();
  if (last) sections.push(last);
  return sections.length ? sections : text.trim() ? [text.trim()] : [];
}

/** 섹션을 빈 줄 문단으로 나눈다. */
export function splitParagraphs(section: string): string[] {
  return section
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * 긴 텍스트를 헤더·문단 경계를 우선해 겹침(overlap) 있는 청크로 나눈다.
 * (plan 021 semantic chunking)
 */
export function chunkText(text: string, size = 900, overlap = 150): Chunk[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  // 헤더 섹션이 여러 개면 전체 길이가 size 이하여도 섹션 단위로 유지 (맥락 보존)
  const headerSections = splitByMarkdownHeaders(clean);
  if (clean.length <= size) {
    if (headerSections.length <= 1) return [{ idx: 0, content: clean }];
    return headerSections.map((content, idx) => ({ idx, content }));
  }

  const units: string[] = [];
  for (const section of headerSections) {
    const paras = splitParagraphs(section);
    if (!paras.length) continue;
    // 섹션이 size 이하면 통째로, 아니면 문단 단위로 쌓는다
    if (section.length <= size) {
      units.push(section);
      continue;
    }
    for (const p of paras) {
      if (p.length <= size) {
        units.push(p);
      } else {
        // 초장문 문단: 문장/줄 경계로 강제 분할
        units.push(...hardSlice(p, size, overlap));
      }
    }
  }

  const packed = packUnits(units, size, overlap);
  return packed.map((content, idx) => ({ idx, content }));
}

function hardSlice(text: string, size: number, overlap: number): string[] {
  const out: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      const slice = text.slice(start, end);
      const brk = Math.max(
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("。"),
      );
      if (brk > size * 0.5) end = start + brk + 1;
    }
    const piece = text.slice(start, end).trim();
    if (piece) out.push(piece);
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return out;
}

/** 문단/유닛을 size 이하로 묶어 청크열을 만든다. 청크 간 overlap 유지. */
function packUnits(units: string[], size: number, overlap: number): string[] {
  if (!units.length) return [];
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    const t = current.trim();
    if (t) chunks.push(t);
    current = "";
  };

  for (const unit of units) {
    if (!current) {
      current = unit;
      continue;
    }
    const joined = `${current}\n\n${unit}`;
    if (joined.length <= size) {
      current = joined;
    } else {
      flush();
      // overlap: 이전 청크 꼬리를 다음 시작에 붙임
      if (chunks.length && overlap > 0) {
        const prev = chunks[chunks.length - 1]!;
        const tail = prev.slice(Math.max(0, prev.length - overlap)).trim();
        current = tail ? `${tail}\n\n${unit}` : unit;
        if (current.length > size) {
          // 꼬리+유닛이 너무 크면 유닛만
          current = unit;
        }
      } else {
        current = unit;
      }
    }
  }
  flush();
  return chunks;
}

/**
 * 코사인 유사도(정규화된 벡터면 내적과 동일하지만, 안전하게 정규화 포함).
 * 차원이 다르면 0을 반환한다.
 */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const len = a.length;
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
