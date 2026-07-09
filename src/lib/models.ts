export type Provider = "gemini" | "groq" | "openrouter";

export interface ModelDef {
  provider: Provider;
  /** 각 제공자에게 실제로 보내는 모델 문자열 */
  model: string;
}

// 사용자에게는 노출되지 않는, 내부 전용 자동 전환 순서.
// 앞에서부터 시도하다가 실패(키 없음/한도 초과/일시 오류)하면 다음으로 자동 이동한다.
// 전부 무료로 쓸 수 있는 모델만 담았다.
export const FALLBACK_MODELS: ModelDef[] = [
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "gemini", model: "gemini-2.5-pro" },
  // Groq: 무료 티어 + 매우 빠른 추론 속도. (llama-3.3-70b-versatile은 2026-06-17부로 폐지되어 제거)
  { provider: "groq", model: "openai/gpt-oss-120b" },
  { provider: "groq", model: "openai/gpt-oss-20b" },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
  { provider: "openrouter", model: "deepseek/deepseek-r1:free" },
  { provider: "openrouter", model: "qwen/qwen-2.5-72b-instruct:free" },
];

/** 영상(URL 입력)/음성 도구는 Gemini 멀티모달만 지원한다. */
export const MULTIMODAL_MODELS: ModelDef[] = FALLBACK_MODELS.filter(
  (m) => m.provider === "gemini"
);
