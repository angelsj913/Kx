"use client";

import Image from "next/image";

type LogoSize = "sm" | "md" | "lg";

const MARK_PX: Record<LogoSize, number> = { sm: 28, md: 36, lg: 44 };
const TEXT_CLS: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

/**
 * ZEFF 브랜드 마크 + 워드마크.
 * - 로고 이미지는 검정 마크 + 투명 배경이라 다크모드에서 묻힌다 → `dark:invert`로 흰색 반전.
 * - 워드마크는 "Zeff" 의 Z 를 악센트 컬러로 강조하고, AI 를 위첨자로 얹어 살짝 개성을 준다.
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
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo-zeff.png"
        alt="ZEFF"
        width={px}
        height={px}
        priority
        className={`shrink-0 rounded-md transition-[filter] duration-300 dark:invert ${
          spin ? "animate-[zeff-spin_1.1s_linear_infinite]" : ""
        }`}
      />
      {withWordmark && (
        <span
          className={`inline-flex items-baseline font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50 ${TEXT_CLS[size]}`}
        >
          <span className="bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400">
            Z
          </span>
          <span>eff</span>
          <sup className="ml-0.5 text-[0.5em] font-bold uppercase tracking-[0.25em] text-blue-500/80 dark:text-blue-300/80">
            AI
          </sup>
        </span>
      )}
    </span>
  );
}
