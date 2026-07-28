"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type LandingLight3DProps = {
  className?: string;
};

/**
 * Subtle CSS 3D accent — no three.js. Pauses when offscreen or reduced-motion.
 */
export default function LandingLight3D({ className = "" }: LandingLight3DProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [offscreen, setOffscreen] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry?.isIntersecting),
      { rootMargin: "80px", threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const paused = reducedMotion || offscreen;

  return (
    <div
      ref={rootRef}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <div className="landing-light3d-stage h-full w-full">
        <div
          className="landing-light3d-tilt"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          <div className="landing-light3d-plane landing-light3d-plane--primary" />
          <div className="landing-light3d-plane landing-light3d-plane--secondary" />
          <div className="landing-light3d-plane landing-light3d-plane--accent" />
        </div>
      </div>
    </div>
  );
}
