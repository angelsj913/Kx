"use client";

import Image from "next/image";

type LogoSize = "sm" | "md" | "lg" | "xl" | "hero";

const MARK_PX: Record<LogoSize, number> = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 56,
  /** 히어로 타이틀과 나란히 쓸 때 — 본문 헤드라인 높이에 맞춤 */
  hero: 64,
};
const TEXT_CLS: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl sm:text-4xl",
  hero: "text-4xl sm:text-6xl",
};
const GAP_CLS: Record<LogoSize, string> = {
  sm: "gap-2",
  md: "gap-2.5",
  lg: "gap-2.5",
  xl: "gap-3",
  hero: "gap-3 sm:gap-4",
};

/**
 * ZEFF 브랜드 마크 + 워드마크.
 * - 로고 이미지는 검정 마크 + 투명 배경 → 다크모드 `dark:invert`
 * - 워드마크: Z 악센트 + AI 위첨자
 */
export default function Logo({
  size = "md",
  withWordmark = true,
  className = "",
  /** AI 작업 중 로딩 표시용 — 마크만 회전 */
  spin = false,
}: {
  size?: LogoSize;
  withWordmark?: boolean;
  className?: string;
  spin?: boolean;
}) {
  const px = MARK_PX[size];
  return (
    <span className={`inline-flex items-center ${GAP_CLS[size]} ${className}`}>
      <Image
        src="/logo-zeff.png"
        alt="ZEFF"
        width={px}
        height={px}
        priority
        className={`shrink-0 rounded-md object-contain transition-[filter] duration-300 dark:invert ${
          size === "hero" ? "h-12 w-12 sm:h-16 sm:w-16" : ""
        } ${spin ? "animate-[zeff-spin_1.1s_linear_infinite]" : ""}`}
      />
      {withWordmark && (
        <span
          className={`inline-flex items-baseline font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50 ${TEXT_CLS[size]}`}
        >
          <span className="bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400">
            Z
          </span>
          <span>eff</span>
          <sup className="ml-0.5 text-[0.45em] font-bold uppercase tracking-[0.2em] text-blue-500/90 dark:text-blue-300/90">
            AI
          </sup>
        </span>
      )}
    </span>
  );
}
