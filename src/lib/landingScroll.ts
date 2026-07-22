"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 스크롤 진행도 p (0→1) — Notion 필름 타임라인 패턴의 단순화.
 * 트랙패드 떨림을 줄이기 위해 목표값으로 부드럽게 보간한다.
 */
export function useScrollProgress(opts?: {
  /** 측정 구간의 상단 오프셋 (px) */
  startOffset?: number;
  /** 구간 높이 배수 (viewport 대비) */
  rangeVh?: number;
}): { p: number; reducedMotion: boolean } {
  const startOffset = opts?.startOffset ?? 0;
  const rangeVh = opts?.rangeVh ?? 2.2;
  const [p, setP] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const target = useRef(0);
  const current = useRef(0);
  const raf = useRef<number | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    setReducedMotion(mq.matches);
    const onMq = () => {
      reduced.current = mq.matches;
      setReducedMotion(mq.matches);
    };
    mq.addEventListener("change", onMq);

    const rangePx = () => window.innerHeight * rangeVh;

    const read = () => {
      const y = Math.max(0, window.scrollY - startOffset);
      target.current = Math.min(1, Math.max(0, y / rangePx()));
      if (reduced.current) {
        current.current = target.current;
        setP(target.current);
      }
    };

    const tick = () => {
      if (!reduced.current) {
        current.current += (target.current - current.current) * 0.12;
        if (Math.abs(target.current - current.current) < 0.0008) {
          current.current = target.current;
        }
        setP(current.current);
      }
      raf.current = requestAnimationFrame(tick);
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    raf.current = requestAnimationFrame(tick);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [startOffset, rangeVh]);

  return { p, reducedMotion };
}
