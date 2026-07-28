/**
 * RAG multi-query expansion — 모호한 질문을 2~3개 변형으로 확장.
 * `RAG_MULTI_QUERY=0` 이면 원문만. LLM 실패 시 휴리스틱으로 fail-open.
 * (plan 021)
 */
import { chatReplyWithFallback } from "@/lib/ai";
import { FALLBACK_MODELS, type ModelDef } from "@/lib/models";

/** `RAG_MULTI_QUERY=0` 이면 비활성. 기본 활성. */
export function isMultiQueryEnabled(): boolean {
  const v = (process.env.RAG_MULTI_QUERY ?? "1").trim().toLowerCase();
  return !(v === "0" || v === "false" || v === "off");
}

/** 동의어·관련어 없이 안전한 휴리스틱 확장 (오프라인/골든용) */
export function expandQueriesHeuristic(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  const variants: string[] = [q];
  const stripped = q.replace(/[?？!！.。]+$/g, "").trim();
  if (stripped && stripped !== q) variants.push(stripped);

  const words = stripped
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (words.length >= 3) {
    variants.push(words.slice(0, Math.ceil(words.length * 0.7)).join(" "));
  }
  if (words.length >= 2) {
    variants.push(words.join(" "));
  }
  return [...new Set(variants.map((v) => v.trim()).filter(Boolean))].slice(0, 3);
}

function parseExpansionList(raw: string, original: string): string[] {
  const out: string[] = [original.trim()];
  const trimmed = raw.trim();
  const bracket = trimmed.match(/\[[\s\S]*?\]/);
  let parsed: unknown;
  try {
    parsed = JSON.parse(bracket?.[0] ?? trimmed);
  } catch {
    parsed = trimmed
      .split(/\n|,/)
      .map((s) => s.replace(/^[\d.\-\*]+\s*/, "").replace(/^["']|["']$/g, "").trim())
      .filter(Boolean);
  }
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const s = String(item ?? "").trim();
      if (s && s !== original) out.push(s);
    }
  }
  return [...new Set(out)].slice(0, 3);
}

function cheapCandidates(): ModelDef[] {
  const cheap = FALLBACK_MODELS.filter((m) => m.cheap || m.free);
  return (cheap.length ? cheap : FALLBACK_MODELS).slice(0, 2);
}

/**
 * 원문 + 확장 쿼리 반환. 비활성/실패 시 `[query]`.
 * `RAG_MULTI_QUERY_LLM=1` 일 때만 저가 LLM 시도(기본은 휴리스틱만 — 지연·키 의존 최소화).
 */
export async function expandQueries(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  if (!isMultiQueryEnabled()) return [q];

  const heuristic = expandQueriesHeuristic(q);
  const wantLlm = (process.env.RAG_MULTI_QUERY_LLM ?? "0").trim() === "1";
  if (!wantLlm) return heuristic;

  try {
    const result = await chatReplyWithFallback({
      systemInstruction:
        "Expand the user search query into up to 2 alternate phrasings (synonyms, related terms). Reply with ONLY a JSON string array. No markdown.",
      messages: [{ role: "user", text: q }],
      candidates: cheapCandidates(),
    });
    const merged = parseExpansionList(result.text, q);
    return merged.length ? merged.slice(0, 3) : heuristic;
  } catch {
    return heuristic;
  }
}
