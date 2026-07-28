import type { EvidenceItem } from "@/lib/ragWeb";

export type EvidenceBundle = {
  web: EvidenceItem[];
  materials: EvidenceItem[];
  all: EvidenceItem[];
};

export type LibraryChunkEvidenceInput = {
  n: number;
  libraryItemId: string;
  title: string;
  snippet: string;
  score: number;
};

export function chunksToEvidence(ranked: LibraryChunkEvidenceInput[]): EvidenceItem[] {
  return ranked.map((c) => ({
    sourceType: "library" as const,
    title: c.title,
    url: `library:${c.libraryItemId}:${c.n}`,
    snippet: c.snippet,
    score: c.score,
  }));
}
