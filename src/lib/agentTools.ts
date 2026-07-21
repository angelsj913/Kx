import { evaluateExpr } from "@/lib/safeExpr";
import type { ModelTier } from "@/lib/models";
import type { OpenAIToolSchema } from "@/lib/openaiCompat";
import { retrieveChunks } from "@/lib/ragSearch";
import { runToolGeneration } from "@/lib/toolGeneration";

/**
 * 에이전트가 부를 수 있는 도구 레지스트리. 제공자 무관 스펙 하나를 정의하고,
 * OpenAI function-calling 스키마로 직렬화한다(Gemini functionDeclarations 어댑터는
 * 이번 범위 밖 — 강한 OpenAI 호환 모델로 충분).
 */

export interface AgentToolCtx {
  userId: string;
  workspaceId?: string | null;
  modelTier?: ModelTier;
  onStatus?: (detail: string) => void;
}

/** 퀵툴 산출물을 채팅 히스토리에 저장할 때 쓰는 필드(라우트 퀵툴 브랜치와 동일). */
export interface ArtifactPayload {
  replyText: string;
  outputType: string;
  structuredKind?: string;
  resultData?: string;
  fileUrl?: string;
  fileName?: string;
  provider: string;
  model: string;
  attempts: number;
}

export type AgentToolOutcome =
  | { terminal: false; text: string }
  | { terminal: true; artifact: ArtifactPayload };

export interface AgentToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run(args: Record<string, unknown>, ctx: AgentToolCtx): Promise<AgentToolOutcome>;
}

export function toOpenAITools(specs: AgentToolSpec[]): OpenAIToolSchema[] {
  return specs.map((s) => ({
    type: "function",
    function: { name: s.name, description: s.description, parameters: s.parameters },
  }));
}

// ── 개별 도구 ──

const KNOWLEDGE_SEARCH: AgentToolSpec = {
  name: "knowledge_search",
  description:
    "사용자의 서재/워크스페이스에 색인된 문서에서 관련 내용을 검색한다. 업로드한 자료·내부 지식에 대한 질문일 때 사용.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "검색할 질문이나 키워드" },
    },
    required: ["query"],
  },
  async run(args, ctx) {
    const query = String(args.query ?? "").trim();
    if (!query) return { terminal: false, text: "검색어가 비어 있습니다." };
    ctx.onStatus?.(`지식베이스 검색 중… (${query.slice(0, 30)})`);
    const { ranked, empty } = await retrieveChunks({
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
      query,
      k: 6,
    });
    if (empty) return { terminal: false, text: "색인된 문서가 없습니다." };
    if (ranked.length === 0) return { terminal: false, text: "관련된 내용을 찾지 못했습니다." };
    const text = ranked
      .map((r) => `[${r.n}] (출처: ${r.title})\n${r.content}`)
      .join("\n\n");
    return { terminal: false, text };
  },
};

const CALCULATOR: AgentToolSpec = {
  name: "calculator",
  description:
    "수식을 정확히 계산한다(사칙연산, 지수, 삼각함수, 단위 없는 공식 대입 등). 임의 코드 실행이 아니라 수식 평가 전용.",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "평가할 수식. 예: 2*(3+4)^2, sin(pi/6), 1500*1.08",
      },
    },
    required: ["expression"],
  },
  async run(args, ctx) {
    const expr = String(args.expression ?? "").trim();
    if (!expr) return { terminal: false, text: "수식이 비어 있습니다." };
    ctx.onStatus?.(`계산 중… (${expr.slice(0, 40)})`);
    const value = evaluateExpr(expr);
    if (value == null) {
      return { terminal: false, text: "계산할 수 없는 수식입니다." };
    }
    return { terminal: false, text: `${expr} = ${value}` };
  },
};

const WEB_SEARCH: AgentToolSpec = {
  name: "web_search",
  description:
    "실시간 웹 검색으로 최신 정보나 외부 사실을 찾는다. 최근 뉴스·시세·문서 밖 일반 지식 질문에 사용.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "웹 검색 질의" },
    },
    required: ["query"],
  },
  async run(args, ctx) {
    const query = String(args.query ?? "").trim();
    if (!query) return { terminal: false, text: "검색어가 비어 있습니다." };
    const key = process.env.TAVILY_API_KEY?.trim();
    if (!key) return { terminal: false, text: "웹 검색을 사용할 수 없습니다." };
    ctx.onStatus?.(`웹 검색 중… (${query.slice(0, 30)})`);
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          query,
          max_results: 5,
          include_answer: true,
        }),
      });
      if (!res.ok) return { terminal: false, text: `웹 검색 오류 (${res.status})` };
      const data = (await res.json()) as {
        answer?: string;
        results?: { title?: string; url?: string; content?: string }[];
      };
      const parts: string[] = [];
      if (data.answer) parts.push(`요약: ${data.answer}`);
      (data.results ?? []).forEach((r, i) => {
        parts.push(`[${i + 1}] ${r.title ?? ""} (${r.url ?? ""})\n${r.content ?? ""}`);
      });
      return {
        terminal: false,
        text: parts.join("\n\n") || "검색 결과가 없습니다.",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "웹 검색 실패";
      return { terminal: false, text: `웹 검색 실패: ${msg}` };
    }
  },
};

// zeff_tool이 오케스트레이션할 수 있는 퀵툴 허용목록(전체 도구가 아니라 안전한 생성 도구만).
const ZEFF_TOOL_IDS = [
  "image-gen",
  "ppt",
  "excel",
  "word-doc",
  "math-solve",
  "math-graph",
  "doc-translate",
] as const;

const ZEFF_TOOL: AgentToolSpec = {
  name: "zeff_tool",
  description:
    "ZEFF의 생성 도구를 실행해 산출물(이미지·PPT·엑셀·문서·수학풀이·그래프·번역)을 만든다. 사용자가 무언가를 '만들어/생성해/그려/번역해' 달라고 할 때 사용. 실행하면 결과가 사용자에게 바로 표시되고 대화가 종료된다.",
  parameters: {
    type: "object",
    properties: {
      toolId: {
        type: "string",
        enum: [...ZEFF_TOOL_IDS],
        description:
          "실행할 도구. image-gen(이미지), ppt(PPT), excel(엑셀), word-doc(워드), math-solve(수학풀이), math-graph(그래프), doc-translate(번역)",
      },
      instruction: {
        type: "string",
        description: "그 도구에 전달할 구체적 요청 텍스트",
      },
    },
    required: ["toolId", "instruction"],
  },
  async run(args, ctx) {
    const toolId = String(args.toolId ?? "");
    const instruction = String(args.instruction ?? "").trim();
    if (!(ZEFF_TOOL_IDS as readonly string[]).includes(toolId)) {
      return { terminal: false, text: `알 수 없는 도구입니다: ${toolId}` };
    }
    if (!instruction) return { terminal: false, text: "요청 내용이 비어 있습니다." };
    ctx.onStatus?.(`${toolId} 생성 중…`);
    const result = await runToolGeneration({
      toolId,
      text: instruction,
      userId: ctx.userId,
      modelTier: ctx.modelTier,
    });
    return { terminal: true, artifact: toArtifact(result) };
  },
};

/** ToolGenerationResult → 저장/렌더용 아티팩트 필드 (라우트 퀵툴 브랜치와 동일 매핑). */
function toArtifact(result: Awaited<ReturnType<typeof runToolGeneration>>): ArtifactPayload {
  const base = {
    provider: result.meta.provider,
    model: result.meta.model,
    attempts: result.meta.attempts,
    outputType: result.outputType,
  };
  if (result.outputType === "markdown") {
    return {
      ...base,
      replyText: result.text,
      fileUrl: result.file?.url,
      fileName: result.file?.filename,
    };
  }
  if (result.outputType === "structured") {
    return {
      ...base,
      replyText: `${result.tool.short} 초안을 완성했어요. 아래에서 바로 확인하고 편집할 수 있어요.`,
      resultData: result.resultData,
      structuredKind: result.structuredKind,
    };
  }
  if (result.outputType === "image") {
    return {
      ...base,
      replyText: "이미지를 생성했어요. 아래에서 확인하고 다운로드할 수 있어요.",
      fileUrl: result.file.url,
      fileName: result.file.filename,
    };
  }
  if (result.outputType === "docx") {
    return {
      ...base,
      replyText: "워드 문서(.docx)를 만들었어요. 아래에서 다운로드할 수 있어요.",
      fileUrl: result.file.url,
      fileName: result.file.filename,
    };
  }
  // pptx | xlsx
  return {
    ...base,
    replyText:
      result.outputType === "pptx"
        ? "PPT 파일(.pptx)을 만들었어요. 아래에서 미리보고 다운로드할 수 있어요."
        : "엑셀 파일(.xlsx)을 만들었어요. 아래에서 확인하고 다운로드하세요.",
    resultData: result.resultData,
    fileUrl: result.file.url,
    fileName: result.file.filename,
  };
}

/** 현재 환경에서 사용 가능한 도구 목록. Tavily 키가 없으면 web_search는 빠진다. */
export function buildAgentTools(): AgentToolSpec[] {
  const tools: AgentToolSpec[] = [KNOWLEDGE_SEARCH, CALCULATOR, ZEFF_TOOL];
  if (process.env.TAVILY_API_KEY?.trim()) {
    tools.splice(2, 0, WEB_SEARCH); // calculator 다음, zeff_tool 앞
  }
  return tools;
}
