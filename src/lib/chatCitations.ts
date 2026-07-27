import type { RankedChunk } from "@/lib/ragSearch";
import type { WebSearchHit } from "@/lib/webSearch";

export interface ChatCitation {
  n: number;
  title: string;
  snippet: string;
  score?: number;
  libraryItemId?: string;
  url?: string;
  source: "library" | "web";
}

export function rankedChunksToCitations(ranked: RankedChunk[]): ChatCitation[] {
  return ranked.map((r) => ({
    n: r.n,
    title: r.title,
    snippet: r.snippet,
    score: r.score,
    libraryItemId: r.libraryItemId,
    source: "library" as const,
  }));
}

export function webHitsToCitations(hits: WebSearchHit[]): ChatCitation[] {
  return hits.map((h, i) => ({
    n: i + 1,
    title: h.title,
    snippet: h.snippet,
    url: h.url,
    source: "web" as const,
  }));
}
