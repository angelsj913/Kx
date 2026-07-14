"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/**
 * 큰 모니터에서 공식 홈 UI가 너무 작게 보이지 않도록
 * 뷰포트 너비에 맞춰 root 폰트 크기(rem 기준)를 비율 확대합니다.
 *
 * - 모바일·일반 노트북(<1280px): 배율 1 (기존 Tailwind 반응형 유지)
 * - 와이드·4K: 최대 ~1.55배까지 자동 확대
 * - rem 기반 간격·글자·max-width(max-w-6xl 등)가 함께 커짐
 */

const MIN_WIDTH = 1280;
/** 배율 1.0 기준 너비 (이보다 넓으면 확대) */
const BASE_WIDTH = 1536;
/** 과도한 확대로 레이아웃이 뭉개지지 않게 상한 */
const MAX_SCALE = 1.55;

function computeScale(width: number): number {
  if (width < MIN_WIDTH) return 1;
  const raw = width / BASE_WIDTH;
  return Math.min(Math.max(raw, 1), MAX_SCALE);
}

export default function LandingViewportScale({ children }: { children: ReactNode }) {
  // SSR/첫 페인트는 1 — 클라이언트에서 실제 배율 적용 (레이아웃 점프 최소화)
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let raf = 0;

    const apply = () => {
      const next = computeScale(window.innerWidth);
      setScale(next);
      // 랜딩 전용 CSS 변수 (필요 시 개별 컴포넌트에서 사용)
      document.documentElement.style.setProperty("--landing-ui-scale", String(next));
      // rem 스케일: Tailwind의 text-*, max-w-*, gap 등이 함께 커짐
      document.documentElement.style.fontSize =
        next === 1 ? "" : `${(16 * next).toFixed(3)}px`;
    };

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("resize", onResize, { passive: true });
    // 브라우저 UI(주소창 등)로 viewport가 바뀌는 경우
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      document.documentElement.style.removeProperty("--landing-ui-scale");
      document.documentElement.style.fontSize = "";
    };
  }, []);

  return (
    <div
      data-landing-scale={scale.toFixed(3)}
      className="landing-viewport-scale min-h-screen"
      style={
        {
          // 실제 스케일은 html font-size(rem)로 처리
          ["--landing-ui-scale" as string]: scale,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
