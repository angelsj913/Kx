import { MissingApiKeyError } from "./gemini";

/** 원본 오류 → 사용자가 조치할 수 있는 한국어 메시지 */
export function friendlyError(err: unknown): string {
  if (err instanceof MissingApiKeyError) return err.message;

  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();

  if (
    lower.includes("api key not valid") ||
    lower.includes("api_key_invalid") ||
    lower.includes("invalid api key") ||
    lower.includes("api 키가 없") ||
    (lower.includes("401") && (lower.includes("key") || lower.includes("auth")))
  ) {
    return "API 키가 올바르지 않습니다. Vercel에서 GROQ_API_KEY / OPENROUTER_API_KEY / DEEPSEEK_API_KEY / GEMINI_API_KEY 를 확인해 주세요.";
  }

  if (
    lower.includes("insufficient credits") ||
    lower.includes("never purchased credits")
  ) {
    return "OpenRouter 크레딧이 없습니다. free 모델·Groq·DeepSeek 키를 쓰거나 openrouter.ai에서 충전하세요.";
  }

  if (lower.includes("deepseek") && (lower.includes("balance") || lower.includes("insufficient"))) {
    return "DeepSeek 잔액이 부족합니다. platform.deepseek.com 에서 소액 충전하거나 다른 키(Groq/OpenRouter)를 사용하세요.";
  }

  if (
    lower.includes("free_tier") ||
    lower.includes("generate_content_free_tier") ||
    (lower.includes("gemini") && lower.includes("quota"))
  ) {
    return "Gemini 무료 할당량이 없습니다. OpenRouter 키로 자동 전환됩니다. Google AI Studio에서 할당량/결제를 열면 Gemini도 다시 쓸 수 있습니다.";
  }

  if (
    lower.includes("provider returned error") ||
    lower.includes("no endpoints") ||
    lower.includes("provider error")
  ) {
    return "일부 free 모델 제공자가 일시 오류입니다. 다른 모델로 자동 재시도 중이니 잠시 후 다시 보내 주세요.";
  }

  if (
    lower.includes("일시적으로 모든 ai") ||
    lower.includes("사용 가능한 ai 모델이 없")
  ) {
    return msg;
  }

  if (
    lower.includes("no longer available") ||
    lower.includes("not found") ||
    lower.includes("unavailable for free")
  ) {
    return "요청한 AI 모델을 잠시 사용할 수 없습니다. 다시 시도해 주세요.";
  }

  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("resource_exhausted")
  ) {
    return "AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도하거나 할당량을 확인해 주세요.";
  }

  if (lower.includes("timeout") || lower.includes("etimedout") || lower.includes("aborted")) {
    return "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (msg && msg.length > 0 && msg.length < 200 && /[가-힣]/.test(msg) && !lower.includes("error [")) {
    return msg;
  }

  return "AI 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}
