/**
 * 전문 에이전트 정의 + 선정 로직.
 * 실제 실행 오케스트레이션은 backendRoute.ts 가 담당한다.
 */
import {
  FALLBACK_MODELS,
  G_FLASH,
  G_PRO,
  OR_DEEPSEEK,
  OR_LLAMA,
  OR_QWEN,
  modelsForTier,
  type ModelDef,
  type ModelTier,
} from "./models";

export type AgentId = "reasoning" | "research" | "writing" | "general";

export interface AgentDef {
  id: AgentId;
  label: string;
  keywords: RegExp | null;
  systemInstruction: string;
  modelOrder: ModelDef[];
}

const URL_PATTERN = /https?:\/\//;

export const AGENTS: Record<AgentId, AgentDef> = {
  reasoning: {
    id: "reasoning",
    label: "논리·코드·수학",
    keywords:
      /계산|풀어|증명|알고리즘|코드|디버그|버그|최적화|분석해|논리|수학|공식|리팩터|regex|함수|sql|python|javascript|typescript|방정식|미분|적분|확률|통계|시험|문제/i,
    systemInstruction:
      "너는 정확하고 꼼꼼한 논리·수학·코드 전문 AI 에이전트다. 단계적으로 검증하며 명확하게 답하라. 식·근거를 생략하지 마라.",
    modelOrder: [G_PRO, G_FLASH, OR_DEEPSEEK, OR_LLAMA, OR_QWEN],
  },
  research: {
    id: "research",
    label: "리서치·요약",
    keywords:
      /요약|정리해|찾아줘|조사|리서치|자료|출처|참고문헌|비교분석|트렌드|동향|비교해|차이|장단점|리뷰|영상|강의/i,
    systemInstruction:
      "너는 자료 조사와 요약에 능숙한 리서치 전문 AI 에이전트다. 핵심 근거를 명확히 밝히며 답하라. 불확실하면 한계를 밝혀라.",
    modelOrder: [G_FLASH, G_PRO, OR_QWEN, OR_LLAMA, OR_DEEPSEEK],
  },
  writing: {
    id: "writing",
    label: "문서·글쓰기",
    keywords:
      /작성해|써줘|메일|이메일|보고서|초안|편지|카피|블로그|스크립트|대본|문서|제안서|기획|발표/i,
    systemInstruction:
      "너는 글쓰기와 문서 작성에 능숙한 AI 에이전트다. 명확하고 자연스러운 문장으로, 바로 쓸 수 있는 완성본을 제시하라.",
    modelOrder: [G_FLASH, OR_LLAMA, G_PRO, OR_QWEN, OR_DEEPSEEK],
  },
  general: {
    id: "general",
    label: "일반",
    keywords: null,
    systemInstruction:
      "너는 사용자를 돕는 다재다능한 AI 어시스턴트다. 친절하고 정확하게, 필요할 때만 구조를 나눠 답하라.",
    modelOrder: FALLBACK_MODELS,
  },
};

export function pickAgent(text: string, hasAttachments: boolean): AgentDef {
  if (AGENTS.reasoning.keywords!.test(text)) return AGENTS.reasoning;
  if (hasAttachments || URL_PATTERN.test(text) || AGENTS.research.keywords!.test(text)) {
    return AGENTS.research;
  }
  if (AGENTS.writing.keywords!.test(text)) return AGENTS.writing;
  return AGENTS.general;
}

/** 티어에 맞게 에이전트 모델 순서를 재배치 */
export function orderModelsForAgent(
  agent: AgentDef,
  tier: ModelTier,
  hasFiles: boolean,
): ModelDef[] {
  const tierList = modelsForTier(tier, { multimodal: hasFiles });
  const preferred = hasFiles
    ? agent.modelOrder.filter((m) => m.provider === "gemini")
    : agent.modelOrder;

  const seen = new Set<string>();
  const out: ModelDef[] = [];
  const key = (m: ModelDef) => `${m.provider}:${m.model}`;

  for (const m of tierList) {
    if (preferred.some((p) => key(p) === key(m)) || tier === "top") {
      if (!seen.has(key(m))) {
        seen.add(key(m));
        out.push(m);
      }
    }
  }
  for (const m of preferred) {
    if (!seen.has(key(m))) {
      if (tier === "standard" && m.model.includes("pro") && m.provider === "gemini") {
        continue;
      }
      seen.add(key(m));
      out.push(m);
    }
  }
  if (tier === "standard" && !hasFiles) {
    for (const m of tierList) {
      if (!seen.has(key(m))) {
        seen.add(key(m));
        out.push(m);
      }
    }
  }
  return out.length ? out : preferred;
}

// 하위 호환: 기존 import 유지
export { runBackendRoute as runAgentPipeline } from "./backendRoute";
export type { BackendRouteResult as AgentPipelineResult } from "./backendRoute";
