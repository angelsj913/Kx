import type { CSSProperties } from "react";
import type { AppMode } from "./tools";

export interface ModeTheme {
  /** 워크스페이스 배경 */
  bg: string;
  /** 포인트 컬러(버튼, 활성 상태, 슬라이더 등) */
  accent: string;
  /** accent보다 약간 어두운 톤 — 그라디언트 종점용 */
  accentDeep: string;
}

export const MODE_THEMES: Record<AppMode, ModeTheme> = {
  office: {
    bg: "#0F172A",
    accent: "#38BDF8",
    accentDeep: "#0EA5E9",
  },
  student: {
    bg: "#1E1B4B",
    accent: "#C084FC",
    accentDeep: "#A855F7",
  },
};

/** AppWorkspace 루트에 꽂아 하위 전체에 상속시키는 CSS 커스텀 프로퍼티 */
export function themeCssVars(mode: AppMode): CSSProperties {
  const t = MODE_THEMES[mode];
  return {
    "--mode-bg": t.bg,
    "--mode-accent": t.accent,
    "--mode-accent-deep": t.accentDeep,
  } as CSSProperties;
}
