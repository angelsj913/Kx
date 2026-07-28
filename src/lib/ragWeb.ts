import { searchWeb as tavilySearchWeb } from "@/lib/webSearch";
import type { EvidenceItem } from "@/lib/ragEvidenceItems";

export type { EvidenceItem } from "@/lib/ragEvidenceItems";

export function normalizeWebResults(
  rows: Array<{ title: string; url: string; snippet: string; score: number }>,
): EvidenceItem[] {
  return rows
    .filter((row) => row.title && row.url)
    .map((row) => ({
      sourceType: "web" as const,
      title: row.title.trim(),
      url: row.url.trim(),
      snippet: row.snippet.trim(),
      score: row.score,
    }));
}

export async function searchWeb(query: string, budget: number): Promise<EvidenceItem[]> {
  const hits = await tavilySearchWeb(query);
  return normalizeWebResults(
    hits.map((h, i) => ({
      title: h.title,
      url: h.url,
      snippet: h.snippet,
      score: Math.max(0.5, 1 - i * 0.08),
    })),
  ).slice(0, budget);
}
