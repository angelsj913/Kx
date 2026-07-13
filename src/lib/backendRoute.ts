/**
 * ZEFF 백엔드 라우트 (안정성 우선 개편)
 *
 * 1. classify — 키워드로 전문 에이전트(시스템 프롬프트)만 선정
 * 2. generate — 고정 안정 모델 체인 1회 (openrouter/free → … → gemini)
 * 3. verify   — top 티어만, 실패해도 초안 유지 (추가 API 1회 이내)
 * 4. complete
 *
 * 예전 멀티에이전트×다모델 교차 후보는 할당량·지연을 키워 제거.
 */
import { chatReplyWithFallback, type AttemptInfo } from "./ai";
import { AGENTS, pickAgent, type AgentId } from "./agents";
import { modelsForTier, type ModelDef, type ModelTier } from "./models";
import type { ChatMessage } from "./gemini";

export type RouteStage = "classify" | "generate" | "verify" | "complete";

export interface RouteStageEvent {
  stage: RouteStage;
  key: string;
  detail?: string;
  agentId?: AgentId;
  provider?: string;
  model?: string;
}

export interface BackendRouteResult {
  text: string;
  agentId: AgentId;
  modelTier: ModelTier;
  provider: string;
  model: string;
  attempts: number;
  refined: boolean;
  stages: RouteStage[];
  routeLabel: string;
}

const VERIFY_INSTRUCTION = `너는 답변 품질을 검수하는 시니어 에디터다.
[초안]을 다듬어 **최종 답변만** 출력하라. 과정·메타 코멘트 금지.
사실·논리 오류 수정, 핵심 보강, 한국어 문장 정리. 날조 금지.`;

const ZEFF_BASE = `너는 ZEFF 워크스페이스 AI 어시스턴트다.
- 한국어로 명확·친절하게 답한다.
- 사용자가 PPT·엑셀·파일 생성을 원하면 텍스트 목차만 길게 쓰지 말고, 핵심 구성만 간결히 제시한다. (실제 파일은 전용 생성 경로가 처리한다)
- 불확실하면 추측하지 말고 한계를 말한다.
- 바로 쓸 수 있게 구조화한다.`;

function tierRouteLabel(tier: ModelTier): string {
  if (tier === "top") return "route:top";
  if (tier === "priority") return "route:priority";
  return "route:standard";
}

function systemFor(agentId: AgentId, tier: ModelTier): string {
  const agent = AGENTS[agentId];
  const tierHint =
    tier === "top"
      ? "깊게 추론하고 근거를 분명히 하라."
      : tier === "priority"
        ? "정확도와 완성도의 균형을 맞춰라."
        : "핵심을 간결·정확하게.";
  return `${ZEFF_BASE}

[전문 모드: ${agent.label}]
${agent.systemInstruction}

[품질]
${tierHint}`;
}

/**
 * 안정 모델 체인만 사용. 에이전트는 프롬프트에만 영향.
 */
function candidatesFor(tier: ModelTier, hasFiles: boolean): ModelDef[] {
  return modelsForTier(tier, { multimodal: hasFiles });
}

export async function runBackendRoute(args: {
  text: string;
  hasFiles: boolean;
  messages: ChatMessage[];
  modelTier?: ModelTier;
  onStage?: (e: RouteStageEvent) => void;
  onAttempt?: (info: AttemptInfo & { agentId: AgentId; stage: RouteStage }) => void;
}): Promise<BackendRouteResult> {
  const tier: ModelTier = args.modelTier ?? "standard";
  const stages: RouteStage[] = [];

  // 1. classify
  stages.push("classify");
  const primary = pickAgent(args.text, args.hasFiles);
  args.onStage?.({
    stage: "classify",
    key: "status.route.classify",
    detail: primary.id,
    agentId: primary.id,
  });

  const candidates = candidatesFor(tier, args.hasFiles);

  // 2. generate
  stages.push("generate");
  args.onStage?.({
    stage: "generate",
    key: "status.route.generate",
    agentId: primary.id,
    detail: tierRouteLabel(tier),
  });

  let draftAttempts = 0;
  const draft = await chatReplyWithFallback({
    systemInstruction: systemFor(primary.id, tier),
    messages: args.messages,
    candidates,
    onAttempt: (info) => {
      draftAttempts = info.attemptNumber;
      args.onAttempt?.({ ...info, agentId: primary.id, stage: "generate" });
      args.onStage?.({
        stage: "generate",
        key: "status.route.generate.try",
        agentId: primary.id,
        provider: info.provider,
        model: info.model,
        detail: `${info.provider}/${info.model} #${info.attemptNumber}`,
      });
    },
  });

  let finalText = draft.text;
  let finalProvider = draft.provider;
  let finalModel = draft.model;
  let refined = false;
  let verifyAttempts = 0;

  // 3. verify — top 만, free 체인 1~2개만, 실패 시 초안
  const shouldVerify =
    tier === "top" &&
    draft.text.trim().length > 80 &&
    !args.hasFiles &&
    process.env.AI_SKIP_VERIFY !== "1";

  if (shouldVerify) {
    stages.push("verify");
    args.onStage?.({
      stage: "verify",
      key: "status.route.verify.deep",
      agentId: primary.id,
    });

    const verifyModels = modelsForTier("standard").filter(
      (m) => m.provider === "openrouter" && m.free,
    ).slice(0, 2);

    try {
      const verified = await chatReplyWithFallback({
        systemInstruction: VERIFY_INSTRUCTION,
        messages: [
          {
            role: "user",
            text: `[사용자 질문]\n${args.text}\n\n[초안]\n${draft.text}\n\n위 초안을 검수·보정해 최종 답변만 출력하라.`,
          },
        ],
        candidates: verifyModels.length ? verifyModels : candidates.slice(0, 2),
        onAttempt: (info) => {
          verifyAttempts = info.attemptNumber;
          args.onAttempt?.({ ...info, agentId: primary.id, stage: "verify" });
        },
      });
      if (verified.text.trim().length > 20) {
        finalText = verified.text;
        finalProvider = verified.provider;
        finalModel = verified.model;
        refined = true;
      }
    } catch (err) {
      console.warn("[backendRoute] verify skipped, keeping draft", err);
    }
  }

  stages.push("complete");
  args.onStage?.({
    stage: "complete",
    key: refined ? "status.route.complete.refined" : "status.route.complete",
    agentId: primary.id,
    provider: finalProvider,
    model: finalModel,
  });

  return {
    text: finalText,
    agentId: primary.id,
    modelTier: tier,
    provider: finalProvider,
    model: finalModel,
    attempts: draftAttempts + verifyAttempts,
    refined,
    stages,
    routeLabel: tierRouteLabel(tier),
  };
}
