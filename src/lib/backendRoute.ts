/**
 * ZEFF 백엔드 라우트 — 다중 제공자 극대화
 *
 * 1. classify  — 전문 에이전트 + 의도 힌트 + 가용 제공자 풀 표시
 * 2. generate  — 제공자 라운드로빈 모델 체인 (Groq↔Cerebras↔Mistral↔OR↔DeepSeek↔Gemini)
 * 3. verify    — priority/top 에서 생성과 **다른 제공자** 우선 검수
 * 4. complete  — 최종 메타
 */
import { chatReplyWithFallback, chatReplyWithFallbackStream, type AttemptInfo } from "./ai";
import { stripHanja } from "./textSanitize";
import { AGENTS, pickAgent, type AgentId } from "./agents";
import { detectQuickToolFromText, toolIntentLabel } from "./intentTools";
import {
  modelsForTier,
  modelsForVerify,
  type ModelDef,
  type ModelTier,
  type Provider,
} from "./models";
import type { ChatMessage } from "./gemini";
import { listConfiguredProviders } from "./openaiCompat";

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
  intentTool?: string | null;
  providersTried?: string[];
  /** 첫 델타 이후 스트림이 끊겨 중단된 채로 마무리됐는지 (스트리밍 전용) */
  interrupted?: boolean;
}

const VERIFY_LIGHT = `너는 답변 품질을 가볍게 검수하는 에디터다.
[초안]을 다듬어 **최종 답변만** 출력하라. 메타 코멘트 금지.
오타·어색한 문장·빠진 핵심만 고치고, 구조를 크게 바꾸지 마라. 날조 금지.`;

const VERIFY_DEEP = `너는 시니어 에디터·검증 에이전트다.
[초안]을 엄격히 검수해 **최종 답변만** 출력하라. 과정·메타 금지.
1) 사실·논리 오류 수정  2) 빠진 핵심 보강  3) 구체화  4) 구조 정리  5) 한국어 자연화
날조 금지. 초안이 이미 좋으면 소폭 다듬기만.`;

const ZEFF_BASE = `너는 ZEFF 워크스페이스 AI 어시스턴트다.
- 한국어로 명확·친절하게 답한다.
- 한자(漢字)를 절대 섞지 마라. 한자어 단어는 반드시 한글로만 표기한다(예: "落地 지점" (X) → "착지 지점" (O)).
- PPT·엑셀·파일 요청이면 긴 텍스트 초안 대신 핵심 구성만 (실제 파일은 전용 경로).
- 불확실하면 한계를 말한다.
- 바로 쓸 수 있게 구조화한다.`;

function tierRouteLabel(tier: ModelTier): string {
  if (tier === "top") return "route:top · multi-provider+verify";
  if (tier === "priority") return "route:priority · multi-provider+light-verify";
  return "route:standard · multi-provider";
}

function systemFor(agentId: AgentId, tier: ModelTier, intentTool: string | null): string {
  const agent = AGENTS[agentId];
  const tierHint =
    tier === "top"
      ? "깊게 추론하고 근거·단계를 분명히 하라."
      : tier === "priority"
        ? "정확도와 완성도의 균형을 맞춰라."
        : "핵심을 간결·정확하게.";

  const intentHint = intentTool
    ? `\n[의도 힌트] 사용자가 ${toolIntentLabel(intentTool)} 를 원할 수 있다. 채팅 경로라면 핵심만 안내하고 파일 생성은 전용 도구가 처리한다.`
    : "";

  return `${ZEFF_BASE}

${agent.systemInstruction}

[품질 · ${tier}]
${tierHint}${intentHint}`;
}

function availableProviderSummary(): string {
  return listConfiguredProviders()
    .filter((p) => p.set)
    .map((p) => p.provider)
    .join(",");
}

export async function runBackendRoute(args: {
  text: string;
  hasFiles: boolean;
  messages: ChatMessage[];
  modelTier?: ModelTier;
  extraSystemInstruction?: string;
  onStage?: (e: RouteStageEvent) => void;
  onAttempt?: (info: AttemptInfo & { agentId: AgentId; stage: RouteStage }) => void;
  /** 자유 채팅 초안 생성 델타를 실시간 중계한다(퀵툴 경로는 호출하지 않음). */
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}): Promise<BackendRouteResult> {
  const tier: ModelTier = args.modelTier ?? "standard";
  const stages: RouteStage[] = [];
  const providersTried = new Set<string>();

  // ── 1. classify ──
  stages.push("classify");
  const primary = pickAgent();
  const intentTool = detectQuickToolFromText(args.text);
  const pool = availableProviderSummary() || "none";

  args.onStage?.({
    stage: "classify",
    key: "status.route.classify",
    detail: `${primary.id}${intentTool ? ` · intent:${intentTool}` : ""} · keys:${pool}`,
    agentId: primary.id,
  });

  const candidates = modelsForTier(tier, { multimodal: args.hasFiles });

  // ── 2. generate ──
  stages.push("generate");
  args.onStage?.({
    stage: "generate",
    key: "status.route.generate",
    agentId: primary.id,
    detail: `${tierRouteLabel(tier)} · ${candidates.length} candidates`,
  });

  let draftAttempts = 0;
  const draft = await chatReplyWithFallbackStream({
    systemInstruction: [
      systemFor(primary.id, tier, intentTool),
      args.extraSystemInstruction?.trim() ? args.extraSystemInstruction.trim() : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    messages: args.messages,
    candidates,
    signal: args.signal,
    // 스트리밍 중계도 최종본과 동일하게 한자 제거를 적용해, 실시간으로 보여준 내용과
    // done 이벤트로 저장되는 최종 텍스트가 어긋나지 않게 한다.
    onDelta: (delta) => args.onDelta?.(stripHanja(delta)),
    onAttempt: (info) => {
      draftAttempts = info.attemptNumber;
      providersTried.add(info.provider);
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
  providersTried.add(draft.provider);

  let finalText = draft.text;
  let finalProvider = draft.provider;
  let finalModel = draft.model;
  let refined = false;
  let verifyAttempts = 0;

  // ── 3. verify ──
  // 토큰 비증가 + 지연 최소화: standard 무검증, priority/top 도 구조화·중간 길이 초안은 스킵
  const draftLen = draft.text.trim().length;
  const looksStructured =
    draft.text.includes("\n## ") ||
    draft.text.includes("\n- ") ||
    draft.text.includes("```") ||
    draft.text.includes("1.") ||
    (draft.text.match(/\n/g)?.length ?? 0) >= 4;
  // top/priority(결제 플랜)만 검증 — standard는 지연 최소화를 위해 스킵.
  // top은 엄격 검수(VERIFY_DEEP), priority는 가벼운 교정(VERIFY_LIGHT)만 받는다.
  // 중단된(interrupted) 초안은 이미 불완전하므로 검증하지 않고 그대로 마무리한다.
  const shouldVerify =
    process.env.AI_SKIP_VERIFY !== "1" &&
    !args.hasFiles &&
    !draft.interrupted &&
    (tier === "top" || tier === "priority") &&
    draftLen > 600 &&
    !looksStructured;

  if (shouldVerify) {
    stages.push("verify");
    const deep = tier === "top";
    args.onStage?.({
      stage: "verify",
      key: deep ? "status.route.verify.deep" : "status.route.verify.light",
      agentId: primary.id,
      detail: `avoid:${draft.provider}`,
    });

    const verifyModels: ModelDef[] = modelsForVerify(
      deep ? "top" : "standard",
      draft.provider as Provider,
    );

    try {
      const verified = await chatReplyWithFallback({
        systemInstruction: deep ? VERIFY_DEEP : VERIFY_LIGHT,
        messages: [
          {
            role: "user",
            text: [
              "[사용자 질문]",
              args.text,
              "",
              "[초안]",
              draft.text,
              "",
              deep
                ? "위 초안을 엄격히 검수·보정해 최종 답변만 출력하라."
                : "위 초안을 가볍게 다듬어 최종 답변만 출력하라.",
            ].join("\n"),
          },
        ],
        candidates: verifyModels.length ? verifyModels : candidates.slice(0, 3),
        onAttempt: (info) => {
          verifyAttempts = info.attemptNumber;
          providersTried.add(info.provider);
          args.onAttempt?.({ ...info, agentId: primary.id, stage: "verify" });
          args.onStage?.({
            stage: "verify",
            key: "status.route.generate.try",
            provider: info.provider,
            model: info.model,
            detail: `verify ${info.provider}/${info.model}`,
          });
        },
      });
      // 검증 결과가 너무 짧으면 초안 유지
      if (verified.text.trim().length >= Math.min(40, draft.text.trim().length * 0.4)) {
        finalText = verified.text;
        finalProvider = verified.provider;
        finalModel = verified.model;
        refined = true;
      }
    } catch (err) {
      console.warn("[backendRoute] verify failed, keeping draft", err);
    }
  }

  // ── 4. complete ──
  stages.push("complete");
  args.onStage?.({
    stage: "complete",
    key: refined ? "status.route.complete.refined" : "status.route.complete",
    agentId: primary.id,
    provider: finalProvider,
    model: finalModel,
    detail: `tried:${[...providersTried].join("+")}`,
  });

  return {
    text: stripHanja(finalText),
    agentId: primary.id,
    modelTier: tier,
    provider: finalProvider,
    model: finalModel,
    attempts: draftAttempts + verifyAttempts,
    refined,
    stages,
    routeLabel: tierRouteLabel(tier),
    intentTool,
    providersTried: [...providersTried],
    interrupted: draft.interrupted,
  };
}
