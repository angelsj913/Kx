import { retrieveChunks } from "@/lib/ragSearch";
import { MIN_CITATION_SCORE } from "@/lib/ragHybrid";
import { searchWeb, shouldUseWebSearch } from "@/lib/webSearch";

export interface PptSourceChunk {
  n: number;
  title: string;
  content: string;
  snippet: string;
  libraryItemId?: string;
  url?: string;
  source: "library" | "web";
}

export interface PptResearchContext {
  sources: PptSourceChunk[];
  hasSources: boolean;
}

function formatSourceBlock(sources: PptSourceChunk[]): string {
  return sources
    .map((s) => {
      const tag = s.source === "web" ? `web-${s.n}` : String(s.n);
      return `[${tag}] ${s.title}\n${s.content.slice(0, 700)}`;
    })
    .join("\n\n");
}

/** 아웃라인 pass — RAG/웹 발췌를 불릿 아이디어 근거로 주입 */
export function formatPptOutlineContext(sources: PptSourceChunk[]): string {
  if (!sources.length) return "";
  return [
    "[참고 자료 — 아웃라인 작성 시 슬라이드 주제·불릿 아이디어의 근거로 활용]",
    "관련 없는 자료는 무시하고, 제공된 사실만 반영한다.",
    formatSourceBlock(sources),
  ].join("\n\n");
}

/** fill pass — 슬라이드별 sourceRef·notes 출처 주석 */
export function formatPptFillContext(sources: PptSourceChunk[]): string {
  if (!sources.length) return "";
  return [
    "[출처 인용 — fill pass]",
    "각 슬라이드 JSON에 sourceRef(숫자, 위 참고 자료 번호)를 추가한다.",
    "notes 마지막 줄에 '출처 [n]' 또는 '출처 web-n' 형식으로 명시한다.",
    "제공된 자료에 없는 내용은 지어내지 마라.",
    formatSourceBlock(sources),
  ].join("\n\n");
}

export async function buildPptResearchContext(args: {
  userId: string;
  workspaceId?: string | null;
  query: string;
}): Promise<PptResearchContext> {
  const query = args.query.trim();
  if (!query) return { sources: [], hasSources: false };

  const sources: PptSourceChunk[] = [];
  let maxRagScore: number | null = null;

  try {
    const { ranked, empty } = await retrieveChunks({
      userId: args.userId,
      workspaceId: args.workspaceId,
      query,
      k: 4,
    });

    const ragRelevant =
      !empty && ranked.length > 0 && ranked[0].score >= MIN_CITATION_SCORE;

    if (ragRelevant) {
      maxRagScore = ranked[0].score;
      for (const r of ranked) {
        sources.push({
          n: sources.length + 1,
          title: r.title,
          content: r.content,
          snippet: r.snippet,
          libraryItemId: r.libraryItemId,
          source: "library",
        });
      }
    } else if (ranked.length) {
      maxRagScore = ranked[0].score;
    }

    if (shouldUseWebSearch(query, maxRagScore)) {
      const webHits = await searchWeb(query);
      for (const h of webHits) {
        sources.push({
          n: sources.length + 1,
          title: h.title,
          content: h.snippet,
          snippet: h.snippet,
          url: h.url,
          source: "web",
        });
      }
    }
  } catch (err) {
    console.warn("[pptContext] research skipped:", err);
  }

  return { sources, hasSources: sources.length > 0 };
}
