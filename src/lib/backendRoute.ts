/**
 * ZEFF 백엔드 라우트 — 요청을 전문 에이전트로 분류하고,
 * 요금제 티어에 따라 모델 체인·정밀 검증 패스를 적용한다.
 *
 * 단계:
 *  1. classify  — 키워드·첨부 기반 에이전트 선정
 *  2. generate  — 1차 답변 생성 (모델 페일오버)
 *  3. verify    — (priority/top) 정밀 검토·보정 2차 패스
 *  4. complete  — 최종 응답
 */
import { chatReplyWithFallback, type AttemptInfo } from "./ai";
import {
  AGENTS,
  orderModelsForAgent,
  pickAgent,
  type AgentDef,
  type AgentId,
} from "./agents";
import { G_FLASH, G_PRO, modelsForTier, type ModelDef, type ModelTier } from "./models";
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

const VERIFY_INSTRUCTION = `너는 답변 품질을 검수하는 시니어 에디터·검증 에이전트다.
주어진 [초안]을 다음 기준으로 다듬어 **최종 답변만** 출력하라. 과정 설명·메타 코멘트는 쓰지 마라.

검수 기준:
1. 사실·논리 오류 수정
2. 빠진 핵심 단계·근거 보강
3. 모호한 표현을 구체적으로
4. 구조(제목·목록)를 읽기 쉽게
5. 불필요한 군더더기 제거
6. 한국어 문장 자연스럽게

초안이 이미 완벽하면 소폭 다듬기만 하고, 내용을 날조하지 마라.`;

function tierRouteLabel(tier: ModelTier): string {
  if (tier === "top") return "backend-route:top (멀티에이전트+정밀검증)";
  if (tier === "priority") return "backend-route:priority (전문에이전트+경량검증)";
  return "backend-route:standard (표준)";
}

function buildCandidates(
  primary: AgentDef,
  tier: ModelTier,
  hasFiles: boolean,
): { candidates: ModelDef[]; agentByKey: Map<string, AgentId> } {
  const chain: AgentDef[] =
    tier === "standard"
      ? [primary, AGENTS.general]
      : [
          primary,
          ...(["reasoning", "research", "writing", "general"] as AgentId[])
            .filter((id) => id !== primary.id)
            .map((id) => AGENTS[id]),
        ];

  const candidates: ModelDef[] = [];
  const agentByKey = new Map<string, AgentId>();
  for (const agent of chain) {
    for (const m of orderModelsForAgent(agent, tier, hasFiles)) {
      const key = `${m.provider}:${m.model}`;
      if (agentByKey.has(key)) continue;
      agentByKey.set(key, agent.id);
      candidates.push(m);
    }
  }
  if (candidates.length === 0) {
    for (const m of modelsForTier(tier, { multimodal: hasFiles })) {
      const key = `${m.provider}:${m.model}`;
      if (!agentByKey.has(key)) {
        agentByKey.set(key, primary.id);
        candidates.push(m);
      }
    }
  }
  return { candidates, agentByKey };
}

function systemForTier(agent: AgentDef, tier: ModelTier): string {
  const base = agent.systemInstruction;
  if (tier === "top") {
    return `${base}

[백엔드 라우트 · TOP]
- 멀티 에이전트 라우팅으로 선정된 전문 모드다.
- 깊게 추론하고, 근거·단계를 분명히 하라.
- 불확실하면 추측하지 말고 한계를 명시하라.
- 최종 답은 바로 쓸 수 있게 구조화하라.`;
  }
  if (tier === "priority") {
    return `${base}

[백엔드 라우트 · PRIORITY]
- 우선 처리 큐. 정확도와 완성도를 균형 있게.
- 핵심을 빠뜨리지 말고 군더더기는 줄여라.`;
  }
  return `${base}

[백엔드 라우트 · STANDARD]
- 표준 경로. 핵심을 간결·정확하게.`;
}

/**
 * 정밀 백엔드 라우트 실행.
 */
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

  // ── 1. classify ──
  stages.push("classify");
  const primary = pickAgent(args.text, args.hasFiles);
  args.onStage?.({
    stage: "classify",
    key: "status.route.classify",
    detail: primary.id,
    agentId: primary.id,
  });

  const { candidates, agentByKey } = buildCandidates(primary, tier, args.hasFiles);

  // ── 2. generate ──
  stages.push("generate");
  args.onStage?.({
    stage: "generate",
    key: "status.route.generate",
    agentId: primary.id,
    detail: tierRouteLabel(tier),
  });

  let draftAttempts = 0;
  const draft = await chatReplyWithFallback({
    systemInstruction: systemForTier(primary, tier),
    messages: args.messages,
    candidates,
    onAttempt: (info) => {
      draftAttempts = info.attemptNumber;
      const agentId = agentByKey.get(`${info.provider}:${info.model}`) ?? primary.id;
      args.onAttempt?.({ ...info, agentId, stage: "generate" });
      args.onStage?.({
        stage: "generate",
        key: "status.route.generate.try",
        agentId,
        provider: info.provider,
        model: info.model,
        detail: `try#${info.attemptNumber}`,
      });
    },
  });

  const draftAgent =
    agentByKey.get(`${draft.provider}:${draft.model}`) ?? primary.id;

  // ── 3. verify (priority: 짧은 보정, top: 강한 정밀 검증) ──
  let finalText = draft.text;
  let finalProvider = draft.provider;
  let finalModel = draft.model;
  let refined = false;
  let verifyAttempts = 0;

  const shouldVerify =
    (tier === "top" || tier === "priority") &&
    draft.text.trim().length > 40 &&
    !args.hasFiles; // 멀티모달 초안 검증은 텍스트 중심으로 (파일 재첨부 부담↓)

  if (shouldVerify) {
    stages.push("verify");
    args.onStage?.({
      stage: "verify",
      key: tier === "top" ? "status.route.verify.deep" : "status.route.verify.light",
      agentId: draftAgent,
    });

    const verifyModels: ModelDef[] =
      tier === "top"
        ? [G_PRO, G_FLASH, ...modelsForTier("top").filter((m) => m.provider !== "gemini")]
        : [G_FLASH, G_PRO];

    const verifyMessages: ChatMessage[] = [
      {
        role: "user",
        text: [
          "[사용자 질문]",
          args.text,
          "",
          "[초안]",
          draft.text,
          "",
          tier === "top"
            ? "위 초안을 엄격히 검수·보정해 최종 답변만 출력하라."
            : "위 초안을 가볍게 다듬어 최종 답변만 출력하라. 구조를 크게 바꾸지 마라.",
        ].join("\n"),
      },
    ];

    try {
      const verified = await chatReplyWithFallback({
        systemInstruction: VERIFY_INSTRUCTION,
        messages: verifyMessages,
        candidates: verifyModels,
        onAttempt: (info) => {
          verifyAttempts = info.attemptNumber;
          args.onAttempt?.({
            ...info,
            agentId: draftAgent,
            stage: "verify",
          });
        },
      });
      if (verified.text.trim().length > 20) {
        finalText = verified.text;
        finalProvider = verified.provider;
        finalModel = verified.model;
        refined = true;
      }
    } catch (err) {
      // 검증 실패 시 초안 유지
      console.warn("[backendRoute] verify failed, keeping draft", err);
    }
  }

  stages.push("complete");
  args.onStage?.({
    stage: "complete",
    key: refined ? "status.route.complete.refined" : "status.route.complete",
    agentId: draftAgent,
    provider: finalProvider,
    model: finalModel,
  });

  return {
    text: finalText,
    agentId: draftAgent,
    modelTier: tier,
    provider: finalProvider,
    model: finalModel,
    attempts: draftAttempts + verifyAttempts,
    refined,
    stages,
    routeLabel: tierRouteLabel(tier),
  };
}
