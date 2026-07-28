import type { PlanId } from "@/lib/plans";
import { detectQuickToolFromText } from "@/lib/intentTools";
import { getGenerativeBudget } from "@/lib/generativeBudgets";

export type GenerationSkill = "report" | "presentation" | "study" | "inline";

export type EvidenceRoute = "web_first" | "doc_first" | "hybrid";

export type GenerationMode = "standard" | "agentic";

export type AnswerFormat =
  | "compact_fact"
  | "explanatory"
  | "comparison"
  | "study_helper";

export type OutputArtifact = "none" | "docx" | "pptx" | "study_pack";

export type GenerativeRouteDecision = {
  skill: GenerationSkill;
  route: EvidenceRoute;
  mode: GenerationMode;
  answerFormat: AnswerFormat;
  artifact: OutputArtifact;
  freshnessRequired: boolean;
  needsPrivateSources: boolean;
  retrievalBudget: "free" | "paid";
  toolId?: string;
};

export type GenerativeRouteOptions = {
  plan: PlanId;
  hasLibraryContext?: boolean;
  attachedFileIds?: string[];
  forceSkill?: GenerationSkill;
};

const PRIVATE_RE =
  /내가\s*올린|내\s*노트|내\s*자료|내\s*문서|업로드\s*한|올려\s*둔|my\s+(notes|materials|documents|uploads)/i;
const COMPARE_RE =
  /비교|얼마나\s*맞|차이|대조|compare|versus|\bvs\.?\b|difference\s+between/i;
const FRESHNESS_RE =
  /최신|최근|변화|뉴스|트렌드|동향|202[4-9]|올해|this\s+year|latest|recent|current\s+trends?/i;
const GENERATION_RE =
  /(만들|작성|생성|정리|초안|작성해|만들어|리포트|보고서|레포트|report|draft|write|create|generate|prepare|summarize\s+for)/i;
const DEPTH_RE =
  /상세|종합|심층|포괄|comprehensive|in-depth|detailed|\d+\s*(장|페이지|page|slide)/i;
const MULTI_TOPIC_RE =
  /(?:그리고|또한|plus|and\s+also|[,;]\s*.{5,})/i;

const STUDY_TOOL_IDS = new Set([
  "note-a4",
  "lecture-notes",
  "exam-maker",
  "exam-analysis",
  "practice-set",
]);
const REPORT_TOOL_IDS = new Set([
  "meeting",
  "weekly-report",
  "research-draft",
  "word-doc",
]);

function wantsPresentation(text: string, toolSignal: string | null): boolean {
  if (toolSignal === "ppt") return true;
  return (
    /\b(ppt|pptx|powerpoint|slides?|deck|presentation)\b/i.test(text) ||
    /파워\s*포인트|파워포인트|슬라이드|프레젠테이션|발표\s*(용\s*)?(자료|슬라이드|덱)/i.test(
      text,
    ) ||
    (/\bpresentation\b/i.test(text) && GENERATION_RE.test(text))
  );
}

function wantsStudy(text: string, toolSignal: string | null): boolean {
  if (toolSignal && STUDY_TOOL_IDS.has(toolSignal)) return true;
  return (
    /시험\s*(대비|준비|공부)|수능|내신|연습\s*문제|퀴즈|복습|학습\s*자료|강의\s*노트|수업\s*노트|필기/i.test(
      text,
    ) ||
    /\b(study\s*guide|exam\s*prep|practice\s*problems?|lecture\s*notes|class\s*notes)\b/i.test(
      text,
    ) ||
    (/노트|note/i.test(text) && GENERATION_RE.test(text) && !/회의/i.test(text))
  );
}

function wantsReport(text: string, toolSignal: string | null): boolean {
  if (toolSignal && REPORT_TOOL_IDS.has(toolSignal)) return true;
  return (
    /리포트|레포트|보고서|회의록|주간\s*보고|research\s*report|weekly\s*report|meeting\s*minutes/i.test(
      text,
    ) ||
    (/\breport\b/i.test(text) && GENERATION_RE.test(text))
  );
}

function isInlineQuestion(text: string): boolean {
  if (GENERATION_RE.test(text)) return false;
  if (text.length > 80) return false;
  return (
    /[?？]|뭐야|무엇|알려\s*줘|알려줘|explain|what\s+is|what\s+are|how\s+does/i.test(
      text,
    ) || text.length <= 40
  );
}

function complexityScore(text: string, skill: GenerationSkill): number {
  let score = 0;
  if (text.length > 120) score += 2;
  if (MULTI_TOPIC_RE.test(text)) score += 1;
  if (DEPTH_RE.test(text)) score += 2;
  const slideMatch = text.match(/(\d+)\s*(장|slide|slides?|페이지|page)/i);
  if (slideMatch && Number(slideMatch[1]) > 8) score += 2;
  if (skill === "report" && /종합|comprehensive|in-depth|상세/i.test(text)) score += 1;
  return score;
}

function selectToolId(skill: GenerationSkill, text: string, toolSignal: string | null): string | undefined {
  if (toolSignal && toolSignal !== "ppt" && toolSignal !== "presentation") {
    return toolSignal;
  }
  if (skill === "presentation") return toolSignal === "ppt" ? "ppt" : "ppt";
  if (skill === "study") {
    if (/연습\s*문제|practice/i.test(text)) return "practice-set";
    if (/시험\s*분석|exam\s*analysis/i.test(text)) return "exam-analysis";
    return "lecture-notes";
  }
  if (skill === "report") {
    if (/회의록|meeting/i.test(text)) return "meeting";
    if (/주간|weekly/i.test(text)) return "weekly-report";
    return "research-draft";
  }
  return undefined;
}

function selectArtifact(
  skill: GenerationSkill,
  plan: PlanId,
): OutputArtifact {
  const budget = getGenerativeBudget(plan);
  if (skill === "inline") return "none";
  if (skill === "presentation") return budget.allowFileExport ? "pptx" : "none";
  if (skill === "report") return budget.allowFileExport ? "docx" : "none";
  if (skill === "study") return budget.allowFileExport ? "study_pack" : "none";
  return "none";
}

function selectAnswerFormat(
  skill: GenerationSkill,
  wantsCompare: boolean,
): AnswerFormat {
  if (wantsCompare) return "comparison";
  if (skill === "study") return "study_helper";
  if (skill === "inline") return "compact_fact";
  if (skill === "report" || skill === "presentation") return "explanatory";
  return "explanatory";
}

function selectEvidenceRoute(input: {
  needsPrivate: boolean;
  wantsCompare: boolean;
  freshnessRequired: boolean;
  plan: PlanId;
}): EvidenceRoute {
  let route: EvidenceRoute;
  if (input.wantsCompare || (input.needsPrivate && input.freshnessRequired)) {
    route = "hybrid";
  } else if (input.needsPrivate) {
    route = "doc_first";
  } else {
    route = "web_first";
  }

  const budget = getGenerativeBudget(input.plan);
  if (route === "hybrid" && !budget.allowHybrid) {
    if (input.needsPrivate && !input.freshnessRequired) return "doc_first";
    if (input.freshnessRequired && !input.needsPrivate) return "web_first";
    return input.needsPrivate ? "doc_first" : "web_first";
  }
  return route;
}

function selectSkill(
  text: string,
  toolSignal: string | null,
  forceSkill?: GenerationSkill,
): GenerationSkill {
  if (forceSkill) return forceSkill;
  if (wantsPresentation(text, toolSignal)) return "presentation";
  if (wantsStudy(text, toolSignal)) return "study";
  if (wantsReport(text, toolSignal)) return "report";
  if (isInlineQuestion(text)) return "inline";
  if (GENERATION_RE.test(text)) return "report";
  return "inline";
}

export function shouldUseGenerativeRag(input: {
  skill: GenerationSkill;
  forceSkill?: GenerationSkill;
}): boolean {
  if (input.forceSkill) return true;
  return input.skill !== "inline";
}

export function decideGenerativeRoute(
  query: string,
  opts: GenerativeRouteOptions,
): GenerativeRouteDecision {
  const text = query.trim();
  const toolSignal = detectQuickToolFromText(text);
  const hasAttachments = (opts.attachedFileIds?.length ?? 0) > 0;
  const needsPrivate =
    PRIVATE_RE.test(text) || hasAttachments || Boolean(opts.hasLibraryContext);
  const wantsCompare = COMPARE_RE.test(text);
  const freshnessRequired = FRESHNESS_RE.test(text) || wantsCompare;

  const skill = selectSkill(text, toolSignal, opts.forceSkill);
  const route = selectEvidenceRoute({
    needsPrivate,
    wantsCompare,
    freshnessRequired,
    plan: opts.plan,
  });
  const answerFormat = selectAnswerFormat(skill, wantsCompare);
  const artifact = selectArtifact(skill, opts.plan);
  const budget = getGenerativeBudget(opts.plan);

  const score = complexityScore(text, skill);
  const mode: GenerationMode =
    skill !== "inline" &&
    budget.allowAgentic &&
    score >= 2
      ? "agentic"
      : "standard";

  return {
    skill,
    route,
    mode,
    answerFormat,
    artifact,
    freshnessRequired,
    needsPrivateSources: needsPrivate,
    retrievalBudget: opts.plan === "free" ? "free" : "paid",
    toolId: selectToolId(skill, text, toolSignal),
  };
}
