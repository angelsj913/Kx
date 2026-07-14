"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  computeLandingScale,
  type LandingViewportKind,
} from "@/lib/landingScale";

/**
 * 공식 홈: 모바일 / 태블릿 / 데스크톱 배율을 구분해 적용.
 * 비율 수치는 src/lib/landingScale.ts 의 LANDING_SCALE 에서 조정.
 *
 * 적용 방식: documentElement font-size (rem) → Tailwind text/max-w/gap 일괄 스케일
 */

export default function LandingViewportScale({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const [kind, setKind] = useState<LandingViewportKind>("desktop");

  useEffect(() => {
    let raf = 0;

    const apply = () => {
      const { kind: nextKind, scale: nextScale } = computeLandingScale(
        window.innerWidth,
      );
      setKind(nextKind);
      setScale(nextScale);

      const root = document.documentElement;
      root.style.setProperty("--landing-ui-scale", String(nextScale));
      root.dataset.landingViewport = nextKind;

      // 1.0 이면 브라우저 기본(16px)으로 되돌려 Tailwind 기본과 맞춤
      root.style.fontSize =
        nextScale === 1 ? "" : `${(16 * nextScale).toFixed(3)}px`;
    };

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      const root = document.documentElement;
      root.style.removeProperty("--landing-ui-scale");
      root.style.fontSize = "";
      delete root.dataset.landingViewport;
    };
  }, []);

  return (
    <div
      data-landing-scale={scale.toFixed(3)}
      data-landing-viewport={kind}
      className="landing-viewport-scale min-h-screen"
      style={
        {
          ["--landing-ui-scale" as string]: scale,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
