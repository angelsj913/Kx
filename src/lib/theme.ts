import type { CSSProperties } from "react";

/**
 * 홈페이지와 동일한 워크스페이스 강조색 (파랑).
 * 결과/구조화 패널 등이 --mode-accent 변수를 소비한다.
 * (구 office/student 모드별 보라·시안 테마는 라이트/다크 통일 이후 폐기)
 */
export const WORKSPACE_ACCENT = {
  accent: "#2563EB",
  accentDeep: "#4F46E5",
} as const;

/** AppWorkspace 루트에 꽂아 하위 전체에 상속시키는 CSS 커스텀 프로퍼티 */
export function workspaceAccentCssVars(): CSSProperties {
  return {
    "--mode-accent": WORKSPACE_ACCENT.accent,
    "--mode-accent-deep": WORKSPACE_ACCENT.accentDeep,
  } as CSSProperties;
}
