import type { PlanId } from "@/lib/plans";
import {
  decideGenerativeRoute,
  type GenerationSkill,
  type GenerativeRouteDecision,
  shouldUseGenerativeRag,
} from "@/lib/generativeRouter";
import { getGenerativeBudget } from "@/lib/generativeBudgets";
import { retrieveEvidence } from "@/lib/ragEvidence";
import { composeGenerativeResult, evidenceToCitations, type GenerativeResult } from "@/lib/generativeCompose";
import { buildGenerativeResultData } from "@/lib/generativeResultPayload";
import { runAgenticGenerate } from "@/lib/generativeAgent";
import type { ModelTier } from "@/lib/models";

export { shouldUseGenerativeRag };

export async function runGenerativeRag(input: {
  query: string;
  userId: string;
  workspaceId?: string | null;
  plan: PlanId;
  attachments?: string[];
  forceSkill?: GenerationSkill;
  hasLibraryContext?: boolean;
  modelTier?: ModelTier;
  onAttempt?: () => void;
  onUploadStart?: () => void;
}): Promise<GenerativeResult & { resultPayload: string }> {
  const started = Date.now();
  const decision: GenerativeRouteDecision = decideGenerativeRoute(input.query, {
    plan: input.plan,
    hasLibraryContext: input.hasLibraryContext ?? false,
    attachedFileIds: input.attachments,
    forceSkill: input.forceSkill,
  });

  const budget = getGenerativeBudget(input.plan);
  const effectiveMode =
    decision.mode === "agentic" && budget.allowAgentic ? "agentic" : "standard";

  const bundle = await retrieveEvidence({
    query: input.query,
    route: decision.route,
    budget,
    userId: input.userId,
    workspaceId: input.workspaceId,
    libraryItemIds: input.attachments,
  });

  let result: GenerativeResult;

  if (
    effectiveMode === "agentic" &&
    decision.skill !== "inline" &&
    (input.plan === "pro" || input.plan === "professional")
  ) {
    result = await runAgenticGenerate({
      query: input.query,
      decision,
      budget,
      userId: input.userId,
      workspaceId: input.workspaceId,
      libraryItemIds: input.attachments,
      modelTier: input.modelTier,
      plan: input.plan,
      onAttempt: input.onAttempt,
    });
  } else {
    result = await composeGenerativeResult({
      query: input.query,
      decision: { ...decision, mode: "standard" },
      bundle,
      budget,
      userId: input.userId,
      workspaceId: input.workspaceId,
      modelTier: input.modelTier,
      onAttempt: input.onAttempt,
      onUploadStart: input.onUploadStart,
    });
  }

  const citations = evidenceToCitations(result.webSources, result.materialSources);
  const resultPayload = buildGenerativeResultData({
    skill: result.skill,
    mode: result.mode,
    route: result.route,
    summary: result.summary,
    body: result.body,
    structuredKind: result.structuredKind,
    rawStructured: result.resultData,
    citations,
  });

  console.info(
    JSON.stringify({
      event: "generative_rag",
      skill: result.skill,
      route: result.route,
      mode: result.mode,
      plan: input.plan,
      evidenceCounts: { web: result.webSources.length, materials: result.materialSources.length },
      durationMs: Date.now() - started,
    }),
  );

  return { ...result, resultPayload };
}
