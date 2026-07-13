/**
 * 전문 에이전트 정의 + 키워드 선정.
 * 모델 후보는 models.modelsForTier 가 담당 (에이전트는 system prompt 만).
 */
import type { ModelDef, ModelTier } from "./models";
import { FALLBACK_MODELS, modelsForTier } from "./models";

export type AgentId = "reasoning" | "research" | "writing" | "general";

export interface AgentDef {
  id: AgentId;
  label: string;
  keywords: RegExp | null;
  systemInstruction: string;
  /** @deprecated 모델 순서는 modelsForTier 사용. 호환용 필드 */
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
      "정확하고 꼼꼼한 논리·수학·코드 전문 모드. 단계적으로 검증하며 식·근거를 생략하지 마라.",
    modelOrder: FALLBACK_MODELS,
  },
  research: {
    id: "research",
    label: "리서치·요약",
    keywords:
      /요약|정리해|찾아줘|조사|리서치|자료|출처|참고문헌|비교분석|트렌드|동향|비교해|차이|장단점|리뷰|영상|강의/i,
    systemInstruction:
      "자료 조사·요약 전문 모드. 핵심 근거를 밝히고 불확실하면 한계를 명시하라.",
    modelOrder: FALLBACK_MODELS,
  },
  writing: {
    id: "writing",
    label: "문서·글쓰기",
    keywords:
      /작성해|써줘|메일|이메일|보고서|초안|편지|카피|블로그|스크립트|대본|문서|제안서|기획/i,
    systemInstruction:
      "글쓰기·문서 전문 모드. 바로 쓸 수 있는 완성본. PPT/슬라이드 파일 요청이면 긴 텍스트 초안 대신 슬라이드 구성만 짧게.",
    modelOrder: FALLBACK_MODELS,
  },
  general: {
    id: "general",
    label: "일반",
    keywords: null,
    systemInstruction:
      "다재다능한 어시스턴트. 친절하고 정확하게, 필요할 때만 구조를 나눠 답하라.",
    modelOrder: FALLBACK_MODELS,
  },
};

export function pickAgent(text: string, hasAttachments: boolean): AgentDef {
  // 발표+ppt 는 글쓰기 에이전트보다 일반/의도툴이 처리 — 발표만 있으면 writing
  if (AGENTS.reasoning.keywords!.test(text)) return AGENTS.reasoning;
  if (hasAttachments || URL_PATTERN.test(text) || AGENTS.research.keywords!.test(text)) {
    return AGENTS.research;
  }
  // "발표" 단독은 writing에서 빼서 일반 채팅 유지 (ppt 의도는 intentTools)
  if (AGENTS.writing.keywords!.test(text)) return AGENTS.writing;
  return AGENTS.general;
}

/** 호환: 티어 모델 목록 그대로 반환 */
export function orderModelsForAgent(
  _agent: AgentDef,
  tier: ModelTier,
  hasFiles: boolean,
): ModelDef[] {
  return modelsForTier(tier, { multimodal: hasFiles });
}

export { runBackendRoute as runAgentPipeline } from "./backendRoute";
