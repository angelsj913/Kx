import { chatReplyWithFallback } from "@/lib/ai";
import { composeGenerativeResult, type GenerativeResult } from "@/lib/generativeCompose";
import type { GenerativeRouteDecision } from "@/lib/generativeRouter";
import type { GenerativeBudget } from "@/lib/generativeBudgets";
import type { EvidenceBundle } from "@/lib/ragEvidenceItems";
import { retrieveEvidence } from "@/lib/ragEvidence";
import { formatEvidenceForPrompt } from "@/lib/generativeResultPayload";
import { mergeSectionBodies, planOutline } from "@/lib/generativePlan";
import type { ModelTier } from "@/lib/models";
import { citationRules } from "@/lib/prompts/registry";

const MAX_RETRIEVAL_CALLS: Record<string, number> = {
  pro: 15,
  professional: 20,
};

export async function runAgenticGenerate(input: {
  query: string;
  decision: GenerativeRouteDecision;
  budget: GenerativeBudget;
  userId: string;
  workspaceId?: string | null;
  libraryItemIds?: string[];
  modelTier?: ModelTier;
  plan: "pro" | "professional";
  onAttempt?: () => void;
}): Promise<GenerativeResult> {
  const sections = planOutline(input.decision.skill, input.query, input.budget.maxSections);
  const retrievalCap = MAX_RETRIEVAL_CALLS[input.plan] ?? 15;
  let retrievalCalls = 0;

  const mergedEvidence: EvidenceBundle = { web: [], materials: [], all: [] };
  const sectionBodies: Array<{ title: string; body: string }> = [];

  for (const section of sections) {
    if (retrievalCalls >= retrievalCap) break;
    retrievalCalls += 1;

    const bundle = await retrieveEvidence({
      query: section.queryHint,
      route: input.decision.route,
      budget: input.budget,
      userId: input.userId,
      workspaceId: input.workspaceId,
      libraryItemIds: input.libraryItemIds,
    });

    for (const item of bundle.all) {
      if (!mergedEvidence.all.some((e) => e.url === item.url)) {
        mergedEvidence.all.push(item);
        if (item.sourceType === "web") mergedEvidence.web.push(item);
        else mergedEvidence.materials.push(item);
      }
    }

    const reply = await chatReplyWithFallback({
      systemInstruction: [
        "너는 ZEFF 에이전트형 생성기다. 한 섹션만 작성한다.",
        citationRules,
        formatEvidenceForPrompt(bundle),
      ].join("\n\n"),
      messages: [
        {
          role: "user",
          text: `[섹션: ${section.title}]\n원래 요청: ${input.query}\n\n이 섹션만 작성하세요.`,
        },
      ],
      modelTier: input.modelTier ?? "standard",
      onAttempt: input.onAttempt,
    });

    sectionBodies.push({ title: section.title, body: reply.text.trim() });
  }

  const body = mergeSectionBodies(sectionBodies);
  const summary = sectionBodies[0]?.body.split(/\n/)[0]?.slice(0, 200) ?? input.query.slice(0, 200);

  const standard = await composeGenerativeResult({
    query: `${input.query}\n\n[에이전트 초안]\n${body}`,
    decision: { ...input.decision, mode: "standard" },
    bundle: mergedEvidence,
    budget: input.budget,
    userId: input.userId,
    workspaceId: input.workspaceId,
    modelTier: input.modelTier,
    onAttempt: input.onAttempt,
  });

  return {
    ...standard,
    mode: "agentic",
    summary,
    body: standard.body || body,
  };
}
