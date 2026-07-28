import type { ChatCitation } from "@/lib/chatCitations";
import type { EvidenceBundle } from "@/lib/ragEvidenceItems";
import type { EvidenceItem } from "@/lib/ragWeb";
import type { GenerationSkill } from "@/lib/generativeRouter";

export function formatEvidenceForPrompt(bundle: EvidenceBundle): string {
  const lines: string[] = ["[근거 자료 — 답변에 반드시 반영하고 [web-N] 또는 [lib-N]으로 인용]"];

  bundle.web.forEach((item, i) => {
    lines.push(`[web-${i + 1}] ${item.title}\n${item.snippet}\n(${item.url})`);
  });
  bundle.materials.forEach((item, i) => {
    lines.push(`[lib-${i + 1}] ${item.title}\n${item.snippet}\n(${item.url})`);
  });

  if (bundle.all.length === 0) {
    lines.push("(검색된 근거 없음 — 일반 지식으로 답하되 불확실함을 명시)");
  }
  return lines.join("\n\n");
}

export function evidenceToCitations(
  web: EvidenceItem[],
  materials: EvidenceItem[],
): ChatCitation[] {
  const webCitations: ChatCitation[] = web.map((item, i) => ({
    n: i + 1,
    title: item.title,
    snippet: item.snippet,
    score: item.score,
    url: item.url,
    source: "web" as const,
  }));
  const materialCitations: ChatCitation[] = materials.map((item, i) => ({
    n: i + 1,
    title: item.title,
    snippet: item.snippet,
    score: item.score,
    libraryItemId: item.url.replace(/^library:([^:]+).*/, "$1"),
    source: "library" as const,
  }));
  return [...webCitations, ...materialCitations];
}

export function buildGenerativeResultData(input: {
  skill: GenerationSkill;
  mode: string;
  route: string;
  summary: string;
  body: string;
  structuredKind?: string;
  rawStructured?: string;
  citations: ChatCitation[];
}): string {
  const payload: Record<string, unknown> = {
    generative: {
      skill: input.skill,
      mode: input.mode,
      route: input.route,
      summary: input.summary,
      body: input.body,
    },
    citations: input.citations,
  };
  if (input.structuredKind && input.rawStructured) {
    try {
      payload.data = JSON.parse(input.rawStructured);
    } catch {
      payload.data = input.rawStructured;
    }
  }
  return JSON.stringify(payload);
}
