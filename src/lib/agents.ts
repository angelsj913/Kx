/**
 * 자유 채팅 시스템 프롬프트.
 *
 * 예전에는 논리·리서치·글쓰기·일반 4개 페르소나 중 하나를 키워드로 배타적으로
 * 골랐다. 문제: 질문이 "논리이면서 글쓰기이기도" 한 경우를 표현할 수 없고,
 * 키워드가 안 걸리면(특히 비한국어 입력) 가장 부실한 "일반" 페르소나로
 * 떨어져 "AI 성능이 특정 기능에만 집중돼 있다"는 인상을 만들었다.
 * 지금은 배타적 분류를 없애고, 상황별 지침을 전부 담은 단일 범용 프롬프트를
 * 항상 사용한다 — 모델이 질문 성격에 맞는 지침을 스스로 골라 적용한다.
 */
import type { ModelDef, ModelTier } from "./models";
import { FALLBACK_MODELS, modelsForTier } from "./models";

export type AgentId = "general";

export interface AgentDef {
  id: AgentId;
  label: string;
  systemInstruction: string;
  /** @deprecated 모델 순서는 modelsForTier 사용. 호환용 필드 */
  modelOrder: ModelDef[];
}

export const AGENTS: Record<AgentId, AgentDef> = {
  general: {
    id: "general",
    label: "범용",
    systemInstruction: [
      "다재다능한 어시스턴트다. 폭넓은 일반 지식·코딩·수학·글쓰기·자료 조사·잡담까지 무엇이든 자연스럽게 도와라.",
      "질문 성격에 맞춰 아래 지침을 스스로 적용하되, 실제로 해당하는 것만 적용하고 불필요한 형식을 억지로 넣지 마라.",
      "- 논리·코드·수학 질문이면: 단계적으로 검증하며 식·근거를 생략하지 말고 정확하고 꼼꼼하게 답하라.",
      "- 자료 조사·요약·비교 질문이면: 핵심 근거를 밝히고 불확실하면 한계를 명시하라.",
      "- 글쓰기·문서 요청이면: 바로 쓸 수 있는 완성본을 제공하라. PPT/슬라이드 파일 요청이면 긴 텍스트 초안 대신 슬라이드 구성만 짧게(실제 파일은 전용 도구가 처리).",
      "- 위 어디에도 딱 맞지 않는 일반 대화·잡담이면: 친절하고 자연스럽게, 필요할 때만 구조를 나눠 답하라.",
    ].join("\n"),
    modelOrder: FALLBACK_MODELS,
  },
};

export function pickAgent(): AgentDef {
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
