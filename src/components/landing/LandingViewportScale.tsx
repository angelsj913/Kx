"use client";

import { useEffect, type ReactNode } from "react";
import { computeLandingScale } from "@/lib/landingScale";

/**
 * 공식 홈: 큰 모니터에서 rem 배율을 올려 전체 UI 를 키운다.
 * documentElement 의 font-size 를 바꾸면 Tailwind 의 text/max-w/gap 이 일괄로 따라온다.
 * 배율 수치는 src/lib/landingScale.ts 에서 조정.
 *
 * 모바일·태블릿은 배율 1 고정이라 이 컴포넌트가 사실상 아무 일도 하지 않는다 —
 * 그쪽 반응형은 Tailwind 브레이크포인트가 담당한다.
 */
export default function LandingViewportScale({ children }: { children: ReactNode }) {
  useEffect(() => {
    let raf = 0;
    const root = document.documentElement;

    const apply = () => {
      const { scale } = computeLandingScale(window.innerWidth);
      // 1.0 이면 브라우저 기본(16px)으로 되돌려 Tailwind 기본과 맞춘다
      root.style.fontSize = scale === 1 ? "" : `${(16 * scale).toFixed(3)}px`;
    };

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      root.style.fontSize = "";
    };
  }, []);

  return <>{children}</>;
}
