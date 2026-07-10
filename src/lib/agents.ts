import { chatReplyWithFallback, type AttemptInfo, type FallbackResult } from "./ai";
import { FALLBACK_MODELS, type ModelDef } from "./models";
import type { ChatMessage } from "./gemini";

export type AgentId = "reasoning" | "research" | "writing" | "general";

export interface AgentDef {
  id: AgentId;
  keywords: RegExp | null; // null = 캐치올(항상 매치)
  systemInstruction: string;
  modelOrder: ModelDef[];
}

const G_FLASH: ModelDef = { provider: "gemini", model: "gemini-2.5-flash" };
const G_PRO: ModelDef = { provider: "gemini", model: "gemini-2.5-pro" };
const OR_LLAMA: ModelDef = { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" };
const OR_DEEPSEEK: ModelDef = { provider: "openrouter", model: "deepseek/deepseek-r1:free" };
const OR_QWEN: ModelDef = { provider: "openrouter", model: "qwen/qwen-2.5-72b-instruct:free" };

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

function buildCandidates(agent: AgentDef, hasFiles: boolean): ModelDef[] {
  return hasFiles ? agent.modelOrder.filter((m) => m.provider === "gemini") : agent.modelOrder;
}

export interface AgentAttemptInfo extends AttemptInfo {
  agentId: AgentId;
}

export interface AgentPipelineResult extends FallbackResult {
  agentId: AgentId;
}

/**
 * 1차 에이전트를 키워드로 선정하고, 실패 시 고정 우선순위(reasoning>research>writing>general)로
 * 다음 에이전트의 모델 목록으로 자동 페일오버한다. 이미 시도한 provider+model 조합은 건너뛴다.
 * system instruction은 1차로 선택된 에이전트(과업 성격)의 것을 체인 전체에 유지한다.
 */
export async function runAgentPipeline(args: {
  text: string;
  hasFiles: boolean;
  messages: ChatMessage[];
  onAttempt?: (info: AgentAttemptInfo) => void;
}): Promise<AgentPipelineResult> {
  const primary = pickAgent(args.text, args.hasFiles);
  const order = [primary, ...AGENT_PRIORITY.filter((id) => id !== primary.id).map((id) => AGENTS[id])];

  const candidates: ModelDef[] = [];
  const agentByKey = new Map<string, AgentId>();
  for (const agent of order) {
    for (const m of buildCandidates(agent, args.hasFiles)) {
      const key = `${m.provider}:${m.model}`;
      if (agentByKey.has(key)) continue;
      agentByKey.set(key, agent.id);
      candidates.push(m);
    }
  }

  const result = await chatReplyWithFallback({
    systemInstruction: primary.systemInstruction,
    messages: args.messages,
    candidates,
    onAttempt: (info) => {
      const agentId = agentByKey.get(`${info.provider}:${info.model}`) ?? primary.id;
      args.onAttempt?.({ ...info, agentId });
    },
  });

  const wonAgentId = agentByKey.get(`${result.provider}:${result.model}`) ?? primary.id;
  return { ...result, agentId: wonAgentId };
}
