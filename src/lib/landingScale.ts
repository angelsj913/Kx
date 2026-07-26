/**
 * 공식 홈페이지 뷰포트별 UI 배율 설정
 *
 * 모바일·태블릿은 배율을 건드리지 않는다(1 고정) — 그쪽 반응형은 Tailwind
 * 브레이크포인트가 담당한다. 데스크톱만 큰 모니터에서 비율을 키운다.
 *
 * 숫자만 바꿔도 LandingViewportScale 이 즉시 반영합니다.
 */

export const LANDING_SCALE = {
  /** 이 너비 미만은 배율 1 (작은 랩톱 포함) */
  startWidth: 1280,
  /** 배율 1.0 기준 너비 */
  baseWidth: 1536,
  minScale: 1,
  /** 4K 등 상한 — 너무 크면 1.4~1.5, 더 크게는 1.6+ */
  maxScale: 1.55,
} as const;

/** 뷰포트 너비 → 홈 UI rem 배율 */
export function computeLandingScale(width: number): { scale: number } {
  const { startWidth, baseWidth, minScale, maxScale } = LANDING_SCALE;
  if (width < startWidth) return { scale: minScale };

  const raw = width / baseWidth;
  const scale = Math.min(Math.max(raw, minScale), maxScale);
  // 소수 3자리로 안정화 (리사이즈 떨림 감소)
  return { scale: Math.round(scale * 1000) / 1000 };
}
