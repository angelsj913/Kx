/**
 * 공식 홈페이지 뷰포트별 UI 배율 설정
 *
 * - mobile  : 폰 (좁은 화면) — 기본 1, 큰 폰만 살짝 확대 가능
 * - tablet  : 태블릿·작은 노트북
 * - desktop : 데스크톱·와이드·4K — 큰 모니터에서 비율 확대
 *
 * 숫자만 바꿔도 LandingViewportScale 이 즉시 반영합니다.
 */

export type LandingViewportKind = "mobile" | "tablet" | "desktop";

export const LANDING_SCALE = {
  /**
   * 경계 (px, 뷰포트 너비)
   * - width ≤ mobileMax  → mobile
   * - mobileMax < width < desktopMin → tablet
   * - width ≥ desktopMin → desktop
   */
  breakpoints: {
    mobileMax: 767,
    desktopMin: 1024,
  },

  /** 모바일 홈 */
  mobile: {
    /** true 면 항상 minScale 고정 (권장: true — Tailwind 반응형에 맡김) */
    fixed: true,
    /** 고정/하한 배율 */
    minScale: 1,
    /** fixed=false 일 때 큰 폰 상한 (예: 1.06) */
    maxScale: 1.05,
    /** fixed=false 일 때 기준 너비 (iPhone 논리 폭 근처) */
    baseWidth: 390,
  },

  /** 태블릿·중간 화면 홈 */
  tablet: {
    fixed: true,
    minScale: 1,
    maxScale: 1.08,
    baseWidth: 834,
  },

  /**
   * 데스크톱 홈
   * - startWidth 이상부터 확대 시작
   * - scale = clamp(width / baseWidth, minScale, maxScale)
   */
  desktop: {
    fixed: false,
    /** 이 너비 미만이면 데스크톱이라도 1.0 (작은 랩톱) */
    startWidth: 1280,
    /** 배율 1.0 기준 너비 */
    baseWidth: 1536,
    minScale: 1,
    /** 4K 등 상한 — 너무 크면 1.4~1.5, 더 크게는 1.6+ */
    maxScale: 1.55,
  },
} as const;

export function resolveViewportKind(width: number): LandingViewportKind {
  const { mobileMax, desktopMin } = LANDING_SCALE.breakpoints;
  if (width <= mobileMax) return "mobile";
  if (width < desktopMin) return "tablet";
  return "desktop";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function scaleFromProfile(
  width: number,
  profile: {
    fixed: boolean;
    minScale: number;
    maxScale: number;
    baseWidth: number;
    startWidth?: number;
  },
): number {
  if (profile.fixed) return profile.minScale;

  const start = profile.startWidth ?? 0;
  if (width < start) return profile.minScale;

  const raw = width / profile.baseWidth;
  return clamp(raw, profile.minScale, profile.maxScale);
}

/** 뷰포트 너비 → 홈 UI rem 배율 */
export function computeLandingScale(width: number): {
  kind: LandingViewportKind;
  scale: number;
} {
  const kind = resolveViewportKind(width);
  const profile = LANDING_SCALE[kind];
  const scale = scaleFromProfile(width, profile);
  // 소수 3자리로 안정화 (리사이즈 떨림 감소)
  return { kind, scale: Math.round(scale * 1000) / 1000 };
}
