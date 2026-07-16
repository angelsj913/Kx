import { GoogleGenAI } from "@google/genai";

// RAG용 텍스트 임베딩. GEMINI_API_KEY가 있으면 Gemini(gemini-embedding-2)를 쓰고,
// 없으면 결정론적 로컬 임베딩으로 폴백한다(키 없이도 검색이 동작하도록).
// text-embedding-004는 더 이상 embedContent를 지원하지 않아 404가 난다(models.list로 확인).

const EMBED_MODEL = "gemini-embedding-2";
export const LOCAL_DIM = 256;

export type EmbedProvider = "gemini" | "local";

export interface EmbedResult {
  vectors: number[][];
  provider: EmbedProvider;
}

// ── 로컬 폴백: 단어 토큰 + 문자 바이그램을 해시 버킷에 담아 L2 정규화 ──
// (CJK처럼 공백으로 안 나뉘는 언어도 바이그램으로 어느 정도 잡힌다)
function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % LOCAL_DIM;
}

export function localEmbed(text: string): number[] {
  const vec = new Array(LOCAL_DIM).fill(0);
  const lower = text.toLowerCase();
  const words = lower.match(/[\p{L}\p{N}]+/gu) ?? [];
  for (const w of words) vec[hashToken(w)] += 1;
  // 문자 바이그램(공백 제거 후)
  const compact = lower.replace(/\s+/g, "");
  for (let i = 0; i < compact.length - 1; i++) {
    vec[hashToken(compact.slice(i, i + 2))] += 1;
  }
  return normalize(vec);
}

export function normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export async function embedTexts(texts: string[]): Promise<EmbedResult> {
  if (texts.length === 0) return { vectors: [], provider: "local" };

  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.embedContent({ model: EMBED_MODEL, contents: texts });
      const raw = res.embeddings ?? [];
      const vectors = raw.map((e) => e.values ?? []);
      if (vectors.length === texts.length && vectors.every((v) => v.length > 0)) {
        return { vectors: vectors.map(normalize), provider: "gemini" };
      }
    } catch {
      // 키 오류/할당량 등 → 로컬 폴백
    }
  }

  return { vectors: texts.map(localEmbed), provider: "local" };
}

/** 단일 쿼리 임베딩(같은 폴백 규칙). */
export async function embedQuery(text: string): Promise<{ vector: number[]; provider: EmbedProvider }> {
  const { vectors, provider } = await embedTexts([text]);
  return { vector: vectors[0] ?? localEmbed(text), provider };
}
