import type { ChatCitation } from "@/lib/chatCitations";
import type { GenerativeRouteDecision, GenerationSkill } from "@/lib/generativeRouter";
import type { GenerativeBudget } from "@/lib/generativeBudgets";
import type { EvidenceBundle } from "@/lib/ragEvidenceItems";
import type { EvidenceItem } from "@/lib/ragWeb";
import { chatReplyWithFallback } from "@/lib/ai";
import { runToolGeneration } from "@/lib/toolGeneration";
import { getTool } from "@/lib/tools";
import type { ModelTier } from "@/lib/models";
import { citationRules } from "@/lib/prompts/registry";
import { formatEvidenceForPrompt } from "@/lib/generativeResultPayload";

export type GenerativeResult = {
  skill: GenerationSkill;
  mode: "standard" | "agentic";
  route: GenerativeRouteDecision["route"];
  summary: string;
  body: string;
  structuredKind?: string;
  resultData?: string;
  webSources: EvidenceItem[];
  materialSources: EvidenceItem[];
  outputType?: string;
  fileUrl?: string;
  fileName?: string;
  meta: {
    toolId?: string;
    provider: string;
    model: string;
  };
};

export { formatEvidenceForPrompt, evidenceToCitations, buildGenerativeResultData } from "@/lib/generativeResultPayload";

function extractSummary(text: string, fallback: string): string {
  const first = text.split(/\n+/).find((l) => l.trim());
  return (first ?? fallback).slice(0, 200);
}

function structuredPreviewSummary(structuredKind: string, resultData: string): string {
  try {
    const data = JSON.parse(resultData) as Record<string, unknown>;
    if (structuredKind === "lectureNotes") {
      const lines = data.summaryLines;
      if (Array.isArray(lines) && lines.length) return String(lines[0]).slice(0, 200);
    }
    if (structuredKind === "researchDraft") {
      const sections = data.sections as Array<{ title?: string }> | undefined;
      if (sections?.[0]?.title) return sections[0].title.slice(0, 200);
    }
  } catch {
    /* ignore */
  }
  return "생성 결과를 확인하세요.";
}

export async function composeGenerativeResult(input: {
  query: string;
  decision: GenerativeRouteDecision;
  bundle: EvidenceBundle;
  budget: GenerativeBudget;
  userId: string;
  workspaceId?: string | null;
  modelTier?: ModelTier;
  onAttempt?: () => void;
  onUploadStart?: () => void;
}): Promise<GenerativeResult> {
  const { query, decision, bundle, budget, userId, workspaceId, modelTier = "standard" } = input;
  const evidenceBlock = formatEvidenceForPrompt(bundle);
  const toolId = decision.toolId;

  if (decision.skill === "inline") {
    const reply = await chatReplyWithFallback({
      systemInstruction: [
        "너는 ZEFF 생성형 RAG 어시스턴트다. 제공된 근거를 우선 사용하고 출처를 명시한다.",
        citationRules,
        evidenceBlock,
      ].join("\n\n"),
      messages: [{ role: "user", text: query }],
      modelTier,
      onAttempt: input.onAttempt,
    });
    return {
      skill: "inline",
      mode: decision.mode === "agentic" ? "standard" : decision.mode,
      route: decision.route,
      summary: extractSummary(reply.text, query),
      body: reply.text,
      webSources: bundle.web,
      materialSources: bundle.materials,
      meta: { provider: reply.provider, model: reply.model },
    };
  }

  if (!toolId) {
    throw new Error("생성 스킬에 맞는 도구를 찾지 못했습니다.");
  }

  const tool = getTool(toolId);
  if (!tool) throw new Error(`알 수 없는 도구: ${toolId}`);

  const enrichedQuery = `${evidenceBlock}\n\n[사용자 요청]\n${query}`;
  const gen = await runToolGeneration({
    toolId,
    text: enrichedQuery,
    userId,
    workspaceId,
    modelTier,
    pptStage: decision.skill === "presentation" ? "outline" : undefined,
    onAttempt: input.onAttempt,
    onUploadStart: input.onUploadStart,
  });

  const webSources = bundle.web;
  const materialSources = bundle.materials;

  if (gen.outputType === "structured" && gen.structuredKind) {
    const summary = structuredPreviewSummary(gen.structuredKind, gen.resultData ?? "{}");
    const body =
      gen.structuredKind === "pptOutline"
        ? "PPT 구성을 잡았어요. 슬라이드 제목·순서를 확인한 뒤 만들기를 눌러 주세요."
        : `${tool.short} 초안을 완성했어요. 아래에서 확인하고 인용 출처를 검토하세요.`;
    return {
      skill: decision.skill,
      mode: decision.mode === "agentic" ? "standard" : decision.mode,
      route: decision.route,
      summary,
      body,
      structuredKind: gen.structuredKind,
      resultData: gen.resultData,
      outputType: "structured",
      webSources,
      materialSources,
      meta: {
        toolId,
        provider: String(gen.meta.provider),
        model: String(gen.meta.model),
      },
    };
  }

  if (gen.outputType === "pptx" && budget.allowFileExport) {
    return {
      skill: decision.skill,
      mode: decision.mode === "agentic" ? "standard" : decision.mode,
      route: decision.route,
      summary: extractSummary(query, "발표 자료"),
      body: "PPT 파일(.pptx)을 만들었어요. 아래에서 미리보고 다운로드할 수 있어요.",
      resultData: gen.resultData,
      outputType: "pptx",
      fileUrl: gen.file?.url,
      fileName: gen.file?.filename,
      webSources,
      materialSources,
      meta: { toolId, provider: String(gen.meta.provider), model: String(gen.meta.model) },
    };
  }

  if (gen.outputType === "docx" && budget.allowFileExport) {
    return {
      skill: decision.skill,
      mode: decision.mode === "agentic" ? "standard" : decision.mode,
      route: decision.route,
      summary: extractSummary(query, "리포트"),
      body: "워드 문서(.docx)를 만들었어요. 아래에서 다운로드할 수 있어요.",
      outputType: "docx",
      fileUrl: gen.file?.url,
      fileName: gen.file?.filename,
      webSources,
      materialSources,
      meta: { toolId, provider: String(gen.meta.provider), model: String(gen.meta.model) },
    };
  }

  const body = gen.outputType === "markdown" ? gen.text : `${tool.short} 결과를 생성했습니다.`;
  return {
    skill: decision.skill,
    mode: decision.mode === "agentic" ? "standard" : decision.mode,
    route: decision.route,
    summary: extractSummary(body, query),
    body,
    outputType: gen.outputType,
    webSources,
    materialSources,
    meta: { toolId, provider: String(gen.meta.provider), model: String(gen.meta.model) },
  };
}
