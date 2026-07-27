import { MIN_CITATION_SCORE } from "@/lib/ragHybrid";

export interface WebSearchHit {
  title: string;
  url: string;
  snippet: string;
}

const WEB_RESULT_LIMIT = 3;

const LEGAL_FACTUAL_RE =
  /법|법률|규정|조항|처벌|금지|허용|소지|위법|합법|판례|행정처분|헌법|민법|형법|형사|민사|소송|고소|벌금|징역|law|legal|regulation|statute|illegal|criminal|weapon|gun|court|ruling/i;

const CURRENT_EVENTS_RE =
  /최신|뉴스|오늘|현재|요즘|recent|latest|news|today|breaking|202[4-9]/i;

/** RAG가 약하거나 법률·사실·시사 질의일 때 웹 검색을 시도한다. */
export function shouldUseWebSearch(query: string, maxRagScore?: number | null): boolean {
  const q = query.trim();
  if (!q) return false;

  if (maxRagScore == null || maxRagScore < MIN_CITATION_SCORE) {
    return true;
  }

  return LEGAL_FACTUAL_RE.test(q) || CURRENT_EVENTS_RE.test(q);
}

/** Tavily API — `TAVILY_API_KEY` 필요. 키 없으면 빈 배열. */
export async function searchWeb(query: string): Promise<WebSearchHit[]> {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      max_results: WEB_RESULT_LIMIT,
      include_answer: false,
    }),
  });

  if (!res.ok) {
    console.warn("[webSearch] Tavily error:", res.status);
    return [];
  }

  const data = (await res.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };

  return (data.results ?? [])
    .slice(0, WEB_RESULT_LIMIT)
    .map((r) => ({
      title: r.title?.trim() || "Web source",
      url: r.url?.trim() || "",
      snippet: (r.content ?? "").trim().slice(0, 280),
    }))
    .filter((r) => r.url && r.snippet);
}

export function formatWebSearchForAgent(hits: WebSearchHit[]): string {
  if (!hits.length) return "검색 결과가 없습니다.";
  return hits
    .map((h, i) => `[${i + 1}] ${h.title} (${h.url})\n${h.snippet}`)
    .join("\n\n");
}

export function formatWebSearchInstruction(hits: WebSearchHit[]): string {
  const context = hits
    .map((h, i) => `[web-${i + 1}] ${h.title}\n${h.snippet}\n(${h.url})`)
    .join("\n\n");

  return [
    "[웹 검색 결과]",
    "아래는 실시간 웹 검색에서 찾은 참고 자료입니다.",
    "답변 본문에 [web-1][web-2] 형식으로 인용할 수 있습니다. 확실하지 않은 내용은 단정하지 마세요.",
    context,
  ].join("\n");
}
