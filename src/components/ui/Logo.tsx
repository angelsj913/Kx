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
 * - 로고는 검정 마크(라이트)/흰 마크(다크) 두 이미지를 따로 두고 dark:에 따라 보이는
 *   쪽만 교체한다. CSS filter(invert)로 한 장을 반전시키는 대신 이렇게 하는 이유는,
 *   일부 모바일 브라우저(삼성 인터넷 등)에서 filter: invert()가 이미지에 제대로
 *   적용되지 않아 다크모드에서 로고가 배경에 묻히는 문제가 있었기 때문이다.
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
  const spinCls = spin ? "animate-[zeff-spin_1.1s_linear_infinite]" : "";
  return (
    <span className={`inline-flex items-center ${GAP_CLS[size]} ${className}`}>
      {size === "hero" ? (
        // 원본 PNG는 마크 주위 여백이 커서(가시 영역 ~1024px 중 세로 48%) 그대로 넣으면
        // 옆 워드마크 글자 크기 대비 마크가 작아 보인다. 박스를 고정하고 이미지를 확대해
        // 투명 여백을 잘라내 마크만 박스를 채우도록 한다.
        <span className="relative inline-block h-12 w-12 shrink-0 overflow-hidden rounded-md sm:h-16 sm:w-16">
          <Image
            src="/logo-zeff.png"
            alt="ZEFF"
            fill
            priority
            quality={90}
            // 박스(48/64px)보다 2.1배 확대해서 보여주므로, 화질 저하 없이 확대되도록
            // 실제 렌더 크기(박스 x 2.1)에 맞춰 더 큰 원본 해상도를 요청한다.
            sizes="(min-width: 640px) 140px, 105px"
            className={`scale-[2.1] object-contain dark:hidden ${spinCls}`}
          />
          <Image
            src="/logo-zeff-dark.png"
            alt="ZEFF"
            fill
            priority
            quality={90}
            sizes="(min-width: 640px) 140px, 105px"
            className={`hidden scale-[2.1] object-contain dark:block ${spinCls}`}
          />
        </span>
      ) : (
        <>
          <Image
            src="/logo-zeff.png"
            alt="ZEFF"
            width={px}
            height={px}
            priority
            className={`shrink-0 rounded-md object-contain dark:hidden ${spinCls}`}
          />
          <Image
            src="/logo-zeff-dark.png"
            alt="ZEFF"
            width={px}
            height={px}
            priority
            className={`hidden shrink-0 rounded-md object-contain dark:block ${spinCls}`}
          />
        </>
      )}
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
