"use client";

import { useEffect, useRef, useState } from "react";

/** 섹션 내부 스크롤 진행도 p (0→1), RAF 보간 + reduced-motion 대응 */
export function useScrollProgress<T extends HTMLElement>(opts?: { topOffset?: number }) {
  const topOffset = opts?.topOffset ?? 72;
  const sectionRef = useRef<T>(null);
  const [p, setP] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  // 하이드레이션 완료 여부. SSR 단계에서 framer-motion의 initial(opacity:0)을 적용하면
  // JS가 실패했을 때 콘텐츠가 영구히 안 보인다(실제로 CSP가 JS를 막아 장애가 났었다).
  // mounted=false 동안 initial={false}를 주면 서버 HTML이 곧바로 보이는 상태로 나가고,
  // 하이드레이션 이후에만 장면 전환 애니메이션이 동작한다.
  const [mounted, setMounted] = useState(false);
  const target = useRef(0);
  const current = useRef(0);
  const raf = useRef<number | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    setMounted(true);
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
      const top = section.getBoundingClientRect().top + window.scrollY;
      const range = Math.max(1, section.offsetHeight - window.innerHeight);
      return Math.min(1, Math.max(0, (window.scrollY + topOffset - top) / range));
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
      if (Math.abs(target.current - current.current) < 0.0008) current.current = target.current;
      setP(current.current);
      raf.current = current.current === target.current ? null : requestAnimationFrame(tick);
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

  return { sectionRef, p, reducedMotion, mounted };
}

/** 균등 밴드 scene index (히스테리시스 없음). */
export function sceneIndex(p: number, count: number): number {
  if (count <= 1) return 0;
  return Math.min(count - 1, Math.floor(p * count));
}

/**
 * 경계에서 바로 넘어가지 않도록 sticky 버퍼를 둔 scene index.
 * sticky=0.08 → 각 장면 경계의 8% 구간에서는 이전 장면을 유지(전진 시).
 * 후진 시에도 대칭 버퍼로 플리커를 줄인다.
 */
export function stickySceneIndex(
  p: number,
  count: number,
  sticky = 0.08,
  prevIndex?: number,
): number {
  if (count <= 1) return 0;
  const raw = Math.min(count - 1, Math.floor(p * count));
  if (prevIndex == null || prevIndex === raw) return raw;

  const band = 1 / count;
  const boundary = Math.max(prevIndex, raw) * band;
  const dist = Math.abs(p - boundary);
  if (dist < sticky * band) return prevIndex;
  return raw;
}

/** 장면 내 로컬 진행도 0→1 */
export function sceneLocalProgress(p: number, count: number, index: number): number {
  if (count <= 1) return p;
  const start = index / count;
  const end = (index + 1) / count;
  if (p <= start) return 0;
  if (p >= end) return 1;
  return (p - start) / (end - start);
}

/**
 * 연속 가로 트랙용: p 0→1 을 장면 사이 interpolate (CSS transition 없이 중간 장면이 보임)
 *
 * 주의 — CSS에서 translateX의 백분율은 "요소 자기 자신의 너비" 기준이다.
 * 이 트랙은 width: count*100% 이므로, 한 장면(=컨테이너 100%)을 넘기려면
 * 트랙 기준으로는 100/count % 만 이동해야 한다.
 * 예전엔 장면당 100%씩 이동해서(count=3이면 -200%) 실제로는 컨테이너 기준 -600%,
 * 즉 패널 6개만큼 밀려 트랙이 overflow-hidden 밖으로 사라졌다(카드가 빈 화면이 됨).
 */
export function trackTranslatePercent(p: number, count: number): number {
  if (count <= 1) return 0;
  return -(p * (count - 1) * (100 / count));
}
