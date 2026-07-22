"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 대상 섹션 안에서만 계산하는 스크롤 진행도 p (0→1).
 * 스크롤 이벤트는 RAF로 제한하고, 목표값으로 부드럽게 보간한다.
 */
export function useScrollProgress<T extends HTMLElement>(opts?: {
  /** sticky 요소가 고정되는 상단 위치 */
  topOffset?: number;
}): {
  sectionRef: React.RefObject<T | null>;
  p: number;
  reducedMotion: boolean;
} {
  const topOffset = opts?.topOffset ?? 0;
  const sectionRef = useRef<T>(null);
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
      read();
    };

    const measure = () => {
      const section = sectionRef.current;
      if (!section) return 0;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const range = Math.max(1, section.offsetHeight - window.innerHeight);
      return Math.min(1, Math.max(0, (window.scrollY + topOffset - sectionTop) / range));
    };

    const read = () => {
      target.current = measure();
      if (reduced.current) {
        current.current = target.current;
        setP(target.current);
        return;
      }
      if (raf.current == null) raf.current = requestAnimationFrame(tick);
    };

    const tick = () => {
      current.current += (target.current - current.current) * 0.12;
      if (Math.abs(target.current - current.current) < 0.0008) {
        current.current = target.current;
      }
      setP(current.current);
      raf.current =
        current.current === target.current ? null : requestAnimationFrame(tick);
    };

    mq.addEventListener("change", onMq);
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [topOffset]);

  return { sectionRef, p, reducedMotion };
}
