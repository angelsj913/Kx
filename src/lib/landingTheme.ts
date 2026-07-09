import type { AppMode } from "./tools";

/** 랜딩 페이지에서 모드별 시각 정체성을 통일해서 쓰기 위한 스타일 토큰.
 * 직장인 = Navy(slate/sky) + Cyan, 학생 = Indigo + Lavender(violet). */
export interface LandingModeStyle {
  name: string;
  tagline: string;
  headline: string;
  valueProps: string[];
  gradientText: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  borderHover: string;
  accentText: string;
  glow: string;
  chipBg: string;
  chipText: string;
  panelBg: string;
}

export const LANDING_MODE_STYLE: Record<AppMode, LandingModeStyle> = {
  office: {
    name: "직장인 모드",
    tagline: "업무 효율과 전문성",
    headline: "보고와 문서 작업, 더 빠르고 더 프로답게",
    valueProps: [
      "보고서·이메일·PPT·엑셀을 형식 걱정 없이 결과물로 바로 받기",
      "회의 내용은 액션 아이템까지 정리된 회의록으로 자동 변환",
      "주간 보고는 진행률만 조정하면 끝",
    ],
    gradientText: "from-sky-400 to-cyan-300",
    iconBg: "bg-gradient-to-br from-sky-500 to-cyan-500",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-300",
    border: "border-cyan-400/20",
    borderHover: "hover:border-cyan-400/50",
    accentText: "text-cyan-300",
    glow: "bg-cyan-500/10",
    chipBg: "bg-cyan-500/10",
    chipText: "text-cyan-300",
    panelBg: "bg-gradient-to-b from-sky-500/[0.07] to-slate-900/40",
  },
  student: {
    name: "학생 모드",
    tagline: "성적 향상과 시간 관리",
    headline: "공부 시간은 줄이고, 이해는 더 깊게",
    valueProps: [
      "강의 영상·녹음은 핵심만 남긴 복습 노트로 정리",
      "발표문·레포트는 서론부터 결론까지 초안 완성",
      "능동 회상 노트로 시험 직전 훑어보기만 해도 복습 끝",
    ],
    gradientText: "from-indigo-300 to-violet-300",
    iconBg: "bg-gradient-to-br from-indigo-500 to-violet-400",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-300",
    border: "border-violet-400/20",
    borderHover: "hover:border-violet-400/50",
    accentText: "text-violet-300",
    glow: "bg-indigo-500/10",
    chipBg: "bg-violet-500/10",
    chipText: "text-violet-300",
    panelBg: "bg-gradient-to-b from-indigo-500/[0.08] to-slate-900/40",
  },
};
