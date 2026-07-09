/** 제공자(SDK/HTTP)에서 온 원본 오류를 사용자 친화적 한국어 메시지로 변환 */
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();
  if (
    lower.includes("api key not valid") ||
    lower.includes("api_key_invalid") ||
    lower.includes("invalid api key") ||
    lower.includes("unauthorized") ||
    lower.includes("401")
  ) {
    return "API 키가 올바르지 않습니다. 설정에서 키를 다시 확인해 주세요.";
  }
  if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("429")) {
    return "사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "AI 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}
