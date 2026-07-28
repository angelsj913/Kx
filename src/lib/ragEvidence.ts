import type { EvidenceRoute } from "@/lib/generativeRouter";
import type { GenerativeBudget } from "@/lib/generativeBudgets";
import { retrieveChunks } from "@/lib/ragSearch";
import { searchWeb, type EvidenceItem } from "@/lib/ragWeb";
import { splitSourcesByType } from "@/lib/ragHybrid";
import { chunksToEvidence, type EvidenceBundle, type LibraryChunkEvidenceInput } from "@/lib/ragEvidenceItems";

export type { EvidenceBundle } from "@/lib/ragEvidenceItems";
export { chunksToEvidence } from "@/lib/ragEvidenceItems";

export async function retrieveEvidence(input: {
  query: string;
  route: EvidenceRoute;
  budget: GenerativeBudget;
  userId: string;
  workspaceId?: string | null;
  libraryItemIds?: string[];
}): Promise<EvidenceBundle> {
  const { query, route, budget, userId, workspaceId, libraryItemIds } = input;

  let web: EvidenceItem[] = [];
  let materials: EvidenceItem[] = [];

  const needsWeb = route === "web_first" || route === "hybrid";
  const needsDoc = route === "doc_first" || route === "hybrid";

  if (needsWeb) {
    web = (await searchWeb(query, budget.webCandidates)).slice(0, budget.webCandidates);
  }

  if (needsDoc) {
    const { ranked } = await retrieveChunks({
      userId,
      workspaceId,
      libraryItemIds,
      query,
      k: budget.docCandidates,
      rerank: true,
    });
    materials = chunksToEvidence(ranked as LibraryChunkEvidenceInput[]).slice(0, budget.docCandidates);
  }

  const all = [...web, ...materials]
    .sort((a, b) => b.score - a.score)
    .slice(0, budget.maxCitations);

  const split = splitSourcesByType(all);
  return { web: split.web, materials: split.materials, all };
}
