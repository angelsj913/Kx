export type Provider = "gemini" | "openrouter";

export interface ModelDef {
  /** 앱 내부 고유 키 */
  id: string;
  provider: Provider;
  /** 각 제공자에게 실제로 보내는 모델 문자열 */
  model: string;
  label: string;
  description: string;
}

// 전부 무료로 사용할 수 있는 모델만 담았습니다.
// - Gemini: Google AI Studio 무료 등급 (카드 불필요)
// - OpenRouter: 슬러그 끝에 ":free" 가 붙은 무료 모델 (카드 불필요)
// OpenRouter 무료 모델 목록은 바뀔 수 있으니, 필요하면 슬러그만 교체하세요.
export const MODELS: ModelDef[] = [
  {
    id: "gemini-flash",
    provider: "gemini",
    model: "gemini-2.5-flash",
    label: "Gemini · 빠름",
    description: "기본 모델. 빠르고 가벼움 · 무료 (Google)",
  },
  {
    id: "gemini-pro",
    provider: "gemini",
    model: "gemini-2.5-pro",
    label: "Gemini · 고성능",
    description: "더 정교하고 똑똑함 · 무료 등급 (Google)",
  },
  {
    id: "llama-free",
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3",
    description: "메타 오픈 모델 · 무료 (OpenRouter)",
  },
  {
    id: "deepseek-free",
    provider: "openrouter",
    model: "deepseek/deepseek-r1:free",
    label: "DeepSeek R1",
    description: "추론 특화 · 무료 (OpenRouter)",
  },
  {
    id: "qwen-free",
    provider: "openrouter",
    model: "qwen/qwen-2.5-72b-instruct:free",
    label: "Qwen 2.5",
    description: "다국어 강점 · 무료 (OpenRouter)",
  },
];

export const DEFAULT_MODEL = "gemini-flash";

export function getModel(id: unknown): ModelDef {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  gemini: "Google Gemini",
  openrouter: "OpenRouter (무료)",
};
