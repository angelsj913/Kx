import { chatReplyWithFallback, type AttemptInfo, type FallbackResult } from "./ai";
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
import type { ChatMessage } from "./gemini";

export type AgentId = "reasoning" | "research" | "writing" | "general";

export interface AgentDef {
  id: AgentId;
  keywords: RegExp | null; // null = 캐치올(항상 매치)
  systemInstruction: string;
  /** 에이전트 기본 순서 (티어에 따라 재배열·필터됨) */
  modelOrder: ModelDef[];
}

const URL_PATTERN = /https?:\/\//;

export const AGENTS: Record<AgentId, AgentDef> = {
  reasoning: {
    id: "reasoning",
    keywords:
      /계산|풀어|증명|알고리즘|코드|디버그|버그|최적화|분석해|논리|수학|공식|리팩터|regex|함수|sql|python|javascript|typescript/i,
    systemInstruction:
      "너는 정확하고 꼼꼼한 논리·수학·코드 전문 AI 에이전트다. 단계적으로 검증하며 명확하게 답하라.",
    modelOrder: [G_PRO, G_FLASH, OR_DEEPSEEK, OR_LLAMA, OR_QWEN],
  },
  research: {
    id: "research",
    keywords: /요약|정리해|찾아줘|조사|리서치|자료|출처|참고문헌|비교분석|트렌드|동향/i,
    systemInstruction:
      "너는 자료 조사와 요약에 능숙한 리서치 전문 AI 에이전트다. 핵심 근거를 명확히 밝히며 답하라.",
    modelOrder: [G_FLASH, G_PRO, OR_QWEN, OR_LLAMA, OR_DEEPSEEK],
  },
  writing: {
    id: "writing",
    keywords: /작성해|써줘|메일|이메일|보고서|초안|편지|카피|블로그|스크립트|대본/i,
    systemInstruction:
      "너는 글쓰기와 문서 작성에 능숙한 AI 에이전트다. 명확하고 자연스러운 문장으로 답하라.",
    modelOrder: [G_FLASH, OR_LLAMA, G_PRO, OR_QWEN, OR_DEEPSEEK],
  },
  general: {
    id: "general",
    keywords: null,
    systemInstruction: "너는 사용자를 돕는 다재다능한 AI 어시스턴트다.",
    modelOrder: FALLBACK_MODELS,
  },
};

/** 고정 우선순위: 1차 선택 실패 시 이 순서대로 다음 에이전트로 넘어간다. */
const AGENT_PRIORITY: AgentId[] = ["reasoning", "research", "writing", "general"];

export function pickAgent(text: string, hasAttachments: boolean): AgentDef {
  if (AGENTS.reasoning.keywords!.test(text)) return AGENTS.reasoning;
  if (hasAttachments || URL_PATTERN.test(text) || AGENTS.research.keywords!.test(text)) {
    return AGENTS.research;
  }
  if (AGENTS.writing.keywords!.test(text)) return AGENTS.writing;
  return AGENTS.general;
}

/** 티어에 맞게 에이전트 모델 순서를 재배치 */
function orderForTier(agent: AgentDef, tier: ModelTier, hasFiles: boolean): ModelDef[] {
  const tierList = modelsForTier(tier, { multimodal: hasFiles });
  const preferred = hasFiles
    ? agent.modelOrder.filter((m) => m.provider === "gemini")
    : agent.modelOrder;

  // 1) 티어 우선 목록 중 에이전트가 쓰는 모델
  // 2) 에이전트 목록에만 있는 모델
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
      // free: pro는 맨 뒤만
      if (tier === "standard" && m.model.includes("pro") && m.provider === "gemini") {
        continue; // 티어 리스트 끝에만 포함
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

export interface AgentAttemptInfo extends AttemptInfo {
  agentId: AgentId;
}

export interface AgentPipelineResult extends FallbackResult {
  agentId: AgentId;
  modelTier: ModelTier;
}

/**
 * 1차 에이전트 선정 후 페일오버.
 * modelTier에 따라 모델 우선순위가 달라진다 (free / pro / professional).
 */
export async function runAgentPipeline(args: {
  text: string;
  hasFiles: boolean;
  messages: ChatMessage[];
  modelTier?: ModelTier;
  onAttempt?: (info: AgentAttemptInfo) => void;
}): Promise<AgentPipelineResult> {
  const tier: ModelTier = args.modelTier ?? "standard";
  const primary = pickAgent(args.text, args.hasFiles);
  const order = [
    primary,
    ...AGENT_PRIORITY.filter((id) => id !== primary.id).map((id) => AGENTS[id]),
  ];

  // professional: 모든 에이전트를 넓게 체인 (최상위 멀티 라우트)
  // free: 1차 에이전트 위주 + general 폴백
  const agentsToUse =
    tier === "top"
      ? order
      : tier === "priority"
        ? order
        : [primary, AGENTS.general];

  const candidates: ModelDef[] = [];
  const agentByKey = new Map<string, AgentId>();
  for (const agent of agentsToUse) {
    for (const m of orderForTier(agent, tier, args.hasFiles)) {
      const key = `${m.provider}:${m.model}`;
      if (agentByKey.has(key)) continue;
      agentByKey.set(key, agent.id);
      candidates.push(m);
    }
  }

  // free에서도 완전 실패 방지용 최소 후보
  if (candidates.length === 0) {
    for (const m of modelsForTier(tier, { multimodal: args.hasFiles })) {
      const key = `${m.provider}:${m.model}`;
      if (!agentByKey.has(key)) {
        agentByKey.set(key, primary.id);
        candidates.push(m);
      }
    }
  }

  const systemExtra =
    tier === "top"
      ? "\n\n[모드] 최상위 멀티 에이전트 라우트. 필요하면 더 깊게 추론하고 근거를 분명히 하라."
      : tier === "priority"
        ? "\n\n[모드] 우선 처리 큐. 정확도와 완성도를 균형 있게."
        : "\n\n[모드] 표준 모델. 핵심을 간결하고 정확하게.";

  const result = await chatReplyWithFallback({
    systemInstruction: primary.systemInstruction + systemExtra,
    messages: args.messages,
    candidates,
    onAttempt: (info) => {
      const agentId = agentByKey.get(`${info.provider}:${info.model}`) ?? primary.id;
      args.onAttempt?.({ ...info, agentId });
    },
  });

  const wonAgentId = agentByKey.get(`${result.provider}:${result.model}`) ?? primary.id;
  return { ...result, agentId: wonAgentId, modelTier: tier };
}
