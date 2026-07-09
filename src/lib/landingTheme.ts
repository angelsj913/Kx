import type { AppMode } from "./tools";

/** 랜딩 페이지에서 모드별 시각 정체성을 통일해서 쓰기 위한 스타일 토큰.
 * 직장인 = Navy(slate/sky) + Cyan, 학생 = Indigo + Lavender(violet). */
export interface LandingModeStyle {
  name: string;
  shortName: string;
  tagline: string;
  headline: string;
  subline: string;
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
  solidBg: string;
  ring: string;
}

export const LANDING_MODE_STYLE: Record<AppMode, LandingModeStyle> = {
  office: {
    name: "직장인 모드",
    shortName: "직장인",
    tagline: "형식은 AI에게, 판단은 당신에게",
    headline: "쓰는 시간을 줄이고, 검토하는 시간만 남기세요",
    subline:
      "메일 한 통, 보고서 한 장을 완성하는 데 30분씩 쓰지 않아도 됩니다. 요지만 던져두면 나머지는 알아서 정돈됩니다.",
    valueProps: [
      "두서없이 적은 메모도 이메일·보고 형식에 맞는 정중한 문서 두 가지 버전으로",
      "회의가 끝나는 순간, 담당자와 기한이 딸린 회의록이 곧바로 완성",
      "주간 보고는 지난주 내용을 다시 뒤질 필요 없이 슬라이더만 움직이면 끝",
      "발표 자료와 데이터 표는 뼈대가 갖춰진 초안 단계부터 시작",
      "작성한 모든 문서는 로그인한 계정에 안전하게 남아 팀 어디서든 다시 열람",
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
    solidBg: "bg-cyan-500",
    ring: "focus-visible:ring-cyan-400/60",
  },
  student: {
    name: "학생 모드",
    shortName: "학생",
    tagline: "막막함은 줄이고, 이해는 단단하게",
    headline: "시작이 어려운 과제, 첫 문장부터 함께 풀어요",
    subline:
      "빈 화면 앞에서 얼어붙는 시간, 놓친 강의를 처음부터 다시 돌려보는 시간. 그 시간을 진짜 복습과 이해에 씁니다.",
    valueProps: [
      "놓친 강의도 영상 링크 하나면 핵심과 복습 포인트만 골라서 정리",
      "발표문과 과제는 서론의 막막함부터 덜어내고 결론까지 매끄럽게",
      "능동 회상 노트로 시험 전날에도 키워드만 보고 자신 있게 훑어보기",
      "레포트는 서론부터 참고자료 메모까지 손댈 수 있는 초안으로 미리 준비",
      "녹음 파일 하나로 못 들은 구간까지 표시된 필기 노트 완성",
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
    solidBg: "bg-violet-500",
    ring: "focus-visible:ring-violet-400/60",
  },
};
