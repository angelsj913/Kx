export type EvidenceItem = {
  sourceType: "web" | "library" | "note";
  title: string;
  url: string;
  snippet: string;
  score: number;
};

type RawWebRow = {
  title: string;
  url: string;
  snippet: string;
  score: number;
};

export function normalizeWebResults(rows: RawWebRow[]): EvidenceItem[] {
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

/** Web search transport — returns empty until external provider is wired. */
export async function searchWeb(_query: string, _budget: number): Promise<EvidenceItem[]> {
  return [];
}
