/**
 * OpenAI 호환 Chat Completions — 다중 제공자.
 */
import { MissingApiKeyError, SafetyRefusalError, type ChatMessage } from "./gemini";
import type { ToolDef } from "./tools";
import type { Provider } from "./models";

export interface CompatProviderConfig {
  provider: Provider;
  envKey: string;
  baseUrl: string;
  defaultModel: string;
  extraHeaders?: Record<string, string>;
  missingKeyMessage: string;
}

export interface GeneratedImage {
  data: string;
  mimeType: string;
  model: string;
}

type OpenRouterCapabilityCache = {
  expiresAt: number;
  visionModels: string[];
  imageModels: string[];
};

let openRouterCapabilities: OpenRouterCapabilityCache | null = null;
let openRouterCapabilitiesPending: Promise<OpenRouterCapabilityCache> | null = null;
const CAPABILITY_CACHE_MS = 10 * 60 * 1000;

function configuredModels(name: string, fallback: string[]): string[] {
  const raw = process.env[name]?.trim();
  return raw ? raw.split(",").map((model) => model.trim()).filter(Boolean) : fallback;
}

function safetyRefusal(message: string): boolean {
  return /(?:safety|content policy|moderation|policy violation|blocked)/i.test(message);
}

export const PROVIDER_CONFIG: Record<
  Exclude<Provider, "gemini">,
  CompatProviderConfig
> = {
  openrouter: {
    provider: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "openrouter/free",
    extraHeaders: {
      "HTTP-Referer": process.env.NEXTAUTH_URL || "https://kx.vercel.app",
      "X-Title": "ZEFF",
    },
    missingKeyMessage:
      "OpenRouter API 키가 없습니다. OPENROUTER_API_KEY 설정 (openrouter.ai 무료)",
  },
  groq: {
    provider: "groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    missingKeyMessage: "Groq API 키가 없습니다. GROQ_API_KEY 설정 (console.groq.com 무료)",
  },
  deepseek: {
    provider: "deepseek",
    envKey: "DEEPSEEK_API_KEY",
    baseUrl: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-v4-flash",
    missingKeyMessage:
      "DeepSeek API 키가 없습니다. DEEPSEEK_API_KEY 설정 (platform.deepseek.com 초저가)",
  },
  cerebras: {
    provider: "cerebras",
    envKey: "CEREBRAS_API_KEY",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    defaultModel: "llama-3.3-70b",
    missingKeyMessage:
      "Cerebras API 키가 없습니다. CEREBRAS_API_KEY 설정 (cloud.cerebras.ai 무료 티어)",
  },
  mistral: {
    provider: "mistral",
    envKey: "MISTRAL_API_KEY",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-small-latest",
    missingKeyMessage:
      "Mistral API 키가 없습니다. MISTRAL_API_KEY 설정 (console.mistral.ai Experiment 무료)",
  },
  // GitHub Models — GitHub 계정만 있으면 무료(models:read 권한의 PAT 필요).
  // 다만 무료 티어 요청 한도가 다른 무료 제공자보다 훨씬 낮아(모델별 10~15
  // RPM·50~150 RPD, PAT 하나를 앱 전체가 공유) models.ts에서 최후 수단으로만 쓴다.
  github: {
    provider: "github",
    envKey: "GITHUB_MODELS_TOKEN",
    baseUrl: "https://models.github.ai/inference/chat/completions",
    defaultModel: "gpt-4o-mini",
    missingKeyMessage:
      "GitHub Models 토큰이 없습니다. models:read 권한의 GitHub PAT를 GITHUB_MODELS_TOKEN에 설정하세요 (github.com/settings/tokens 무료)",
  },
  // SambaNova Cloud — 영구 무료 티어(카드 등록 불필요). Cohere의 무료 Trial 키는
  // 상업적 이용을 명시적으로 금지해 후보에서 제외했다.
  sambanova: {
    provider: "sambanova",
    envKey: "SAMBANOVA_API_KEY",
    baseUrl: "https://api.sambanova.ai/v1/chat/completions",
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
    missingKeyMessage:
      "SambaNova API 키가 없습니다. SAMBANOVA_API_KEY 설정 (cloud.sambanova.ai 무료 티어)",
  },
};

function requireKey(cfg: CompatProviderConfig, apiKey?: string): string {
  const key = apiKey || process.env[cfg.envKey]?.trim();
  if (!key) throw new MissingApiKeyError(cfg.missingKeyMessage);
  return key;
}

/** OpenAI 멀티모달 content part (텍스트 또는 이미지). */
type OAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OAIMessage {
  role: "system" | "user" | "assistant";
  content: string | OAIContentPart[];
}

const NO_TEXT_FALLBACK = "(첨부 파일은 텍스트 경로에서 처리되지 않습니다)";

/**
 * 첨부 이미지가 있으면 OpenAI 멀티모달 content(배열)로, 없으면 문자열로 만든다.
 * 이미지 계열(image/*)만 image_url 로 싣는다 — PDF·오디오 등은 이 경로가 처리 못 하므로
 * 텍스트만 남기고, 상위 폴백 체인에서 멀티모달 전용(Gemini) 후보가 맡는다.
 */
function buildUserContent(
  text: string,
  files?: { data: string; mimeType: string }[],
): string | OAIContentPart[] {
  const images = (files ?? []).filter((f) => f.mimeType.startsWith("image/"));
  if (images.length === 0) return text || NO_TEXT_FALLBACK;
  const parts: OAIContentPart[] = [];
  if (text) parts.push({ type: "text", text });
  for (const img of images) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.data}` },
    });
  }
  return parts;
}

// ── 에이전트(함수 호출) 지원 ──
// 기존 callCompat/문자열 반환 경로는 건드리지 않고, tools를 실을 수 있는 별도
// 메시지·호출 타입을 추가한다. "OpenAI 호환"은 형식 규격일 뿐이라 Groq·Cerebras·
// Mistral·DeepSeek·SambaNova 등 무료 제공자가 각자 키로 동일하게 받아준다.
interface RawToolCall {
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

export interface OAIToolMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  /** assistant 턴이 도구를 부를 때 */
  tool_calls?: RawToolCall[];
  /** tool 결과 메시지일 때 */
  tool_call_id?: string;
}

/** OpenAI function-calling 스키마 한 개 */
export interface OpenAIToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/** 제공자 무관 정규화된 도구 호출 */
export interface NormalizedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentTurnResult {
  /** 어시스턴트 텍스트 (순수 도구 호출 턴이면 "") */
  content: string;
  /** 최종 답변 턴이면 빈 배열 */
  toolCalls: NormalizedToolCall[];
  provider: Provider;
  model: string;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const e = err as { error?: { message?: string } | string; message?: string };
  const detail =
    (typeof e.error === "object" ? e.error?.message : undefined) ||
    e.message ||
    (typeof e.error === "string" ? e.error : null);
  return detail ? String(detail) : fallback;
}

/**
 * 한 번의 에이전트 턴 — tools를 실어 보내고, 모델이 도구를 부르면 tool_calls를,
 * 아니면 최종 텍스트를 돌려준다. 비스트리밍(툴 결정은 스트리밍하지 않는다).
 */
async function callCompatTools(
  cfg: CompatProviderConfig,
  model: string,
  messages: OAIToolMessage[],
  tools: OpenAIToolSchema[],
  apiKey?: string,
  signal?: AbortSignal,
): Promise<{ content: string; toolCalls: NormalizedToolCall[] }> {
  const key = requireKey(cfg, apiKey);
  const res = await fetch(cfg.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(cfg.extraHeaders ?? {}),
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: "auto",
    }),
    signal,
  });

  if (!res.ok) {
    let msg = `${cfg.provider} 오류 (${res.status})`;
    try {
      msg = extractErrorMessage(await res.json(), msg);
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await res.json();
  if (data?.error?.message) throw new Error(String(data.error.message));

  const message = data?.choices?.[0]?.message ?? {};
  const rawContent = message?.content;
  const content =
    typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent
            .map((p: { text?: string; content?: string }) => p?.text ?? p?.content ?? "")
            .join("")
        : "";

  const rawCalls: RawToolCall[] = Array.isArray(message?.tool_calls) ? message.tool_calls : [];
  const toolCalls: NormalizedToolCall[] = [];
  for (let i = 0; i < rawCalls.length; i++) {
    const c = rawCalls[i];
    const name = c?.function?.name;
    if (!name) continue;
    let args: Record<string, unknown> = {};
    const rawArgs = c?.function?.arguments;
    if (rawArgs) {
      try {
        const parsed = JSON.parse(rawArgs);
        if (parsed && typeof parsed === "object") args = parsed as Record<string, unknown>;
      } catch {
        // 파싱 실패는 throw하지 않고, 원문을 담아 둔다(실행기가 에러 결과로 처리).
        args = { __rawArguments: rawArgs, __parseError: true };
      }
    }
    toolCalls.push({ id: c?.id || `call_${i}`, name, arguments: args });
  }

  return { content, toolCalls };
}

/** 제공자 하나로 에이전트 턴 1회 실행 (폴백은 상위 agentRoute가 담당). */
export async function compatAgentTurn(opts: {
  provider: Exclude<Provider, "gemini">;
  model?: string;
  messages: OAIToolMessage[];
  tools: OpenAIToolSchema[];
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<AgentTurnResult> {
  const cfg = PROVIDER_CONFIG[opts.provider];
  const model = opts.model || cfg.defaultModel;
  const { content, toolCalls } = await callCompatTools(
    cfg,
    model,
    opts.messages,
    opts.tools,
    opts.apiKey,
    opts.signal,
  );
  return { content, toolCalls, provider: opts.provider, model };
}

async function callCompat(
  cfg: CompatProviderConfig,
  model: string,
  messages: OAIMessage[],
  jsonMode = false,
  apiKey?: string,
): Promise<string> {
  const key = requireKey(cfg, apiKey);
  const res = await fetch(cfg.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(cfg.extraHeaders ?? {}),
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    let msg = `${cfg.provider} 오류 (${res.status})`;
    try {
      const err = await res.json();
      const detail =
        err?.error?.message ||
        err?.message ||
        (typeof err?.error === "string" ? err.error : null);
      if (detail) msg = String(detail);
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await res.json();
  if (data?.error?.message) throw new Error(String(data.error.message));
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p: { text?: string; content?: string }) => p?.text ?? p?.content ?? "")
      .join("");
  }
  return "";
}

/** SSE 스트리밍 버전 — 델타가 올 때마다 onDelta로 중계하고, 누적된 전체 텍스트를 반환한다. */
async function callCompatStream(
  cfg: CompatProviderConfig,
  model: string,
  messages: OAIMessage[],
  onDelta: (delta: string) => void,
  apiKey?: string,
  signal?: AbortSignal,
): Promise<string> {
  const key = requireKey(cfg, apiKey);
  const res = await fetch(cfg.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(cfg.extraHeaders ?? {}),
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!res.ok || !res.body) {
    let msg = `${cfg.provider} 오류 (${res.status})`;
    try {
      const err = await res.json();
      const detail =
        err?.error?.message ||
        err?.message ||
        (typeof err?.error === "string" ? err.error : null);
      if (detail) msg = String(detail);
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      let json: unknown;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      const chunk = json as {
        error?: { message?: string };
        choices?: { delta?: { content?: string } }[];
      };
      if (chunk?.error?.message) throw new Error(String(chunk.error.message));
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) {
        full += delta;
        onDelta(delta);
      }
    }
  }
  return full;
}

export async function compatGenerateForTool(opts: {
  provider: Exclude<Provider, "gemini">;
  tool: ToolDef;
  text: string;
  images?: { data: string; mimeType: string }[];
  model?: string;
  apiKey?: string;
}): Promise<string> {
  const cfg = PROVIDER_CONFIG[opts.provider];
  const jsonMode =
    opts.tool.outputType === "pptx" ||
    opts.tool.outputType === "xlsx" ||
    opts.tool.outputType === "structured";
  return callCompat(
    cfg,
    opts.model || cfg.defaultModel,
    [
      { role: "system", content: opts.tool.systemInstruction },
      {
        role: "user",
        content: buildUserContent(opts.text || "요청을 수행해 주세요.", opts.images),
      },
    ],
    jsonMode,
    opts.apiKey,
  );
}

export async function compatChatReply(opts: {
  provider: Exclude<Provider, "gemini">;
  systemInstruction: string;
  messages: ChatMessage[];
  model?: string;
  apiKey?: string;
}): Promise<string> {
  const cfg = PROVIDER_CONFIG[opts.provider];
  return callCompat(
    cfg,
    opts.model || cfg.defaultModel,
    [
      { role: "system", content: opts.systemInstruction },
      ...opts.messages.map((m) => ({
        role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
        content:
          m.role === "model"
            ? m.text || NO_TEXT_FALLBACK
            : buildUserContent(m.text, m.files),
      })),
    ],
    false,
    opts.apiKey,
  );
}

export async function compatChatReplyStream(opts: {
  provider: Exclude<Provider, "gemini">;
  systemInstruction: string;
  messages: ChatMessage[];
  onDelta: (delta: string) => void;
  model?: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const cfg = PROVIDER_CONFIG[opts.provider];
  return callCompatStream(
    cfg,
    opts.model || cfg.defaultModel,
    [
      { role: "system", content: opts.systemInstruction },
      ...opts.messages.map((m) => ({
        role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
        content:
          m.role === "model"
            ? m.text || NO_TEXT_FALLBACK
            : buildUserContent(m.text, m.files),
      })),
    ],
    opts.onDelta,
    opts.apiKey,
    opts.signal,
  );
}

export function hasProviderKey(provider: Provider): boolean {
  if (provider === "gemini") return !!process.env.GEMINI_API_KEY?.trim();
  const cfg = PROVIDER_CONFIG[provider as Exclude<Provider, "gemini">];
  if (!cfg) return false;
  return !!process.env[cfg.envKey]?.trim();
}

/**
 * OpenRouter의 OpenAI 호환 이미지 생성 엔드포인트.
 * 모델은 배포 환경에서 OPENROUTER_IMAGE_MODEL로 교체할 수 있으며, Gemini 키에 의존하지 않는다.
 */
export async function openRouterGenerateImage(input: {
  prompt: string;
  model?: string;
}): Promise<GeneratedImage> {
  const cfg = PROVIDER_CONFIG.openrouter;
  const key = requireKey(cfg);
  const model = input.model || process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-image-1";
  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(cfg.extraHeaders ?? {}),
    },
    body: JSON.stringify({
      model,
      prompt: input.prompt,
      resolution: "1K",
      output_format: "png",
    }),
  });
  if (!res.ok) {
    let detail = `OpenRouter 이미지 생성 오류 (${res.status})`;
    try {
      detail = extractErrorMessage(await res.json(), detail);
    } catch {
      /* keep status message */
    }
    if (safetyRefusal(detail)) throw new SafetyRefusalError(detail);
    throw new Error(detail);
  }
  const payload = await res.json();
  const image = payload?.data?.[0];
  if (typeof image?.b64_json === "string" && image.b64_json) {
    return { data: image.b64_json, mimeType: "image/png", model };
  }
  if (typeof image?.url === "string" && image.url) {
    const downloaded = await fetch(image.url);
    if (!downloaded.ok) throw new Error("생성된 이미지를 가져오지 못했습니다.");
    const type = downloaded.headers.get("content-type") || "image/png";
    return {
      data: Buffer.from(await downloaded.arrayBuffer()).toString("base64"),
      mimeType: type,
      model,
    };
  }
  throw new Error("OpenRouter가 이미지 데이터를 반환하지 않았습니다.");
}

async function discoverOpenRouterCapabilities(): Promise<OpenRouterCapabilityCache> {
  const cfg = PROVIDER_CONFIG.openrouter;
  const key = requireKey(cfg);
  const headers = {
    Authorization: `Bearer ${key}`,
    ...(cfg.extraHeaders ?? {}),
  };
  const [visionResult, imageResult] = await Promise.allSettled([
    fetch("https://openrouter.ai/api/v1/models?input_modalities=image", {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch("https://openrouter.ai/api/v1/images/models", {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
  ]);
  const ids = async (result: PromiseSettledResult<Response>): Promise<string[]> => {
    if (result.status !== "fulfilled" || !result.value.ok) return [];
    const data = await result.value.json().catch(() => ({}));
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows
      .map((row: { id?: unknown; slug?: unknown }) =>
        typeof row.id === "string" ? row.id : typeof row.slug === "string" ? row.slug : "",
      )
      .filter(Boolean);
  };
  return {
    expiresAt: Date.now() + CAPABILITY_CACHE_MS,
    visionModels: await ids(visionResult),
    imageModels: await ids(imageResult),
  };
}

async function capabilities(): Promise<OpenRouterCapabilityCache> {
  if (openRouterCapabilities && openRouterCapabilities.expiresAt > Date.now()) {
    return openRouterCapabilities;
  }
  if (!openRouterCapabilitiesPending) {
    openRouterCapabilitiesPending = discoverOpenRouterCapabilities()
      .then((result) => {
        openRouterCapabilities = result;
        return result;
      })
      .finally(() => {
        openRouterCapabilitiesPending = null;
      });
  }
  return openRouterCapabilitiesPending;
}

function filterVisionModels(preferred: string[], available: Set<string>): string[] {
  const availableBase = new Set([...available].map((model) => model.replace(/:free$/, "")));
  return preferred.filter(
    (model) =>
      available.size === 0 ||
      available.has(model) ||
      availableBase.has(model.replace(/:free$/, "")),
  );
}

/** 무료 OpenRouter 비전 모델 — OPENROUTER_VISION_MODELS env, :free 접미사 우선. */
export async function getOpenRouterVisionModelsFree(): Promise<string[]> {
  const preferred = configuredModels("OPENROUTER_VISION_MODELS", [
    "qwen/qwen2.5-vl-72b-instruct:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
  ]);
  try {
    const available = new Set((await capabilities()).visionModels);
    return filterVisionModels(preferred, available).slice(0, 2);
  } catch {
    return preferred.slice(0, 2);
  }
}

/** 유료 OpenRouter 비전 모델 — OPENROUTER_VISION_PAID_MODELS env. */
export async function getOpenRouterVisionModelsPaid(): Promise<string[]> {
  const preferred = configuredModels("OPENROUTER_VISION_PAID_MODELS", [
    "qwen/qwen2.5-vl-72b-instruct",
    "meta-llama/llama-3.2-11b-vision-instruct",
  ]);
  try {
    const available = new Set((await capabilities()).visionModels);
    return filterVisionModels(preferred, available).slice(0, 2);
  } catch {
    return preferred.slice(0, 2);
  }
}

/** @deprecated Use getOpenRouterVisionModelsFree() for interleaved vision routing. */
export async function getOpenRouterVisionModels(): Promise<string[]> {
  return getOpenRouterVisionModelsFree();
}

/**
 * 비용 순서 OpenRouter 이미지 폴백 (primary 제외).
 * API 카탈로그 전체를 쓰지 않는다 — 크레딧 부족 시 40+회 연쇄 실패를 막기 위해
 * env에 명시한 모델만 최대 MAX_IMAGE_FALLBACKS개 사용한다.
 */
const MAX_IMAGE_FALLBACKS = 2;

export async function getOpenRouterImageModels(): Promise<string[]> {
  const primary = process.env.OPENROUTER_IMAGE_MODEL || "bytedance-seed/seedream-4.5";
  // 기본 폴백: 비교적 저가·널리 지원되는 모델 2개 (env로 교체 가능)
  const preferred = configuredModels("OPENROUTER_IMAGE_FALLBACK_MODELS", [
    "black-forest-labs/flux.2-klein-4b",
    "google/gemini-2.5-flash-image",
  ]).filter((model) => model !== primary);

  try {
    const available = new Set((await capabilities()).imageModels);
    const filtered =
      available.size === 0
        ? preferred
        : preferred.filter((model) => available.has(model));
    return [...new Set(filtered)].slice(0, MAX_IMAGE_FALLBACKS);
  } catch {
    return preferred.slice(0, MAX_IMAGE_FALLBACKS);
  }
}

export function listConfiguredProviders(): {
  provider: string;
  envKey: string;
  set: boolean;
}[] {
  return [
    { provider: "gemini", envKey: "GEMINI_API_KEY", set: !!process.env.GEMINI_API_KEY?.trim() },
    { provider: "groq", envKey: "GROQ_API_KEY", set: !!process.env.GROQ_API_KEY?.trim() },
    {
      provider: "cerebras",
      envKey: "CEREBRAS_API_KEY",
      set: !!process.env.CEREBRAS_API_KEY?.trim(),
    },
    { provider: "mistral", envKey: "MISTRAL_API_KEY", set: !!process.env.MISTRAL_API_KEY?.trim() },
    {
      provider: "openrouter",
      envKey: "OPENROUTER_API_KEY",
      set: !!process.env.OPENROUTER_API_KEY?.trim(),
    },
    {
      provider: "deepseek",
      envKey: "DEEPSEEK_API_KEY",
      set: !!process.env.DEEPSEEK_API_KEY?.trim(),
    },
    {
      provider: "github",
      envKey: "GITHUB_MODELS_TOKEN",
      set: !!process.env.GITHUB_MODELS_TOKEN?.trim(),
    },
    {
      provider: "sambanova",
      envKey: "SAMBANOVA_API_KEY",
      set: !!process.env.SAMBANOVA_API_KEY?.trim(),
    },
  ];
}
