import { MissingApiKeyError } from "./gemini";

/** 제공자(SDK/HTTP)에서 온 원본 오류를 사용자 친화적 한국어 메시지로 변환 */
export function friendlyError(err: unknown): string {
  if (err instanceof MissingApiKeyError) {
    return err.message;
  }

  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();

  if (
    lower.includes("api key not valid") ||
    lower.includes("api_key_invalid") ||
    lower.includes("invalid api key") ||
    lower.includes("api 키가 없") ||
    (lower.includes("unauthorized") && lower.includes("key")) ||
    (lower.includes("401") && lower.includes("key"))
  ) {
    return "API 키가 올바르지 않거나 없습니다. Vercel 환경 변수 GEMINI_API_KEY / OPENROUTER_API_KEY 를 확인해 주세요.";
  }

  if (
    lower.includes("insufficient credits") ||
    lower.includes("never purchased credits") ||
    lower.includes("purchase more at https://openrouter")
  ) {
    return "OpenRouter 크레딧이 없습니다. free 모델(openrouter/free)을 쓰거나 openrouter.ai 에서 소액 충전 후 OPENROUTER_API_KEY를 확인해 주세요.";
  }

  if (
    lower.includes("free_tier") ||
    lower.includes("generate_content_free_tier") ||
    (lower.includes("quota") && lower.includes("gemini"))
  ) {
    return "Gemini 무료 할당량이 없거나 소진되었습니다. OpenRouter 키(OPENROUTER_API_KEY)로 자동 전환됩니다. Google AI Studio에서 결제/할당량을 열면 Gemini도 다시 쓸 수 있습니다.";
  }

  if (
    lower.includes("provider returned error") ||
    lower.includes("no endpoints") ||
    lower.includes("provider error")
  ) {
    return "OpenRouter free 모델 제공자가 일시 오류입니다. 잠시 후 다시 시도해 주세요. (여러 free 모델로 자동 재시도합니다)";
  }

  if (
    lower.includes("no longer available") ||
    lower.includes("not found") ||
    lower.includes("unavailable for free") ||
    (lower.includes("model") && lower.includes("404"))
  ) {
    return "요청한 AI 모델을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("resource_exhausted")
  ) {
    return "AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도하거나 Google AI Studio / OpenRouter 할당량을 확인해 주세요.";
  }

  if (lower.includes("timeout") || lower.includes("etimedout") || lower.includes("aborted")) {
    return "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (msg && msg.length > 0 && msg.length < 180 && !lower.includes("stack")) {
    if (/[가-힣]/.test(msg) && !lower.includes("error [")) {
      return msg;
    }
  }

  return "AI 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}
