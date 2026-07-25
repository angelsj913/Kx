"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Zap, Target, Waves } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

const DEMO = {
  mp4: "/videos/workspace-math-chat.mp4",
  webm: "/videos/workspace-math-chat.webm",
  poster: "/videos/workspace-math-chat-poster.jpg",
  labelKey: "workspace.video1" as const,
};

export default function WorkspaceIntro() {
  const t = useLandingT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  // 자동재생이 실제로 실패했을 때만 재생 버튼을 띄운다(평소엔 연출을 방해하지 않음).
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.play().then(
      () => setNeedsTap(false),
      // iOS 저전력 모드 등은 muted여도 play()를 거부한다. 조용히 삼키지 않고
      // 버튼을 노출해 사용자가 직접 재생할 수 있게 한다.
      () => setNeedsTap(true),
    );
  }, []);

  // 화면 안에 있을 때만 재생 — 모바일 데이터·배터리 절약.
  // 동작 줄이기가 켜져 있으면 자동재생하지 않고 컨트롤만 제공한다.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tryPlay();
        else el.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, tryPlay]);

  const features = [
    { icon: Zap, title: t("workspace.feature1.title"), desc: t("workspace.feature1.desc"), detail: t("workspace.feature1.detail") },
    { icon: Target, title: t("workspace.feature2.title"), desc: t("workspace.feature2.desc"), detail: t("workspace.feature2.detail") },
    { icon: Waves, title: t("workspace.feature3.title"), desc: t("workspace.feature3.desc"), detail: t("workspace.feature3.detail") },
  ];

  return (
    <section id="potential" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="mx-auto max-w-2xl break-keep text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {t("workspace.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t("workspace.subtitle")}
          </p>
        </div>

        {/* 브라우저 크롬을 씌워 "실제 제품 화면"으로 읽히게 한다 */}
        <div className="relative mt-10 overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-950 shadow-2xl shadow-slate-900/20 dark:border-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            </span>
            <span className="mx-auto rounded-md bg-white/10 px-3 py-1 text-[11px] text-white/50">
              zeffai.com/app
            </span>
          </div>

          <video
            ref={videoRef}
            className="block aspect-video w-full object-cover object-top"
            poster={DEMO.poster}
            preload="auto"
            muted
            loop
            playsInline
            controls={reduced}
            aria-label={t(DEMO.labelKey)}
            onCanPlay={() => {
              if (!reduced) tryPlay();
            }}
          >
            {/* MP4를 먼저 둔다 — Safari/iOS는 WebM을 재생하지 못하는 버전이 많다.
                브라우저는 재생 가능한 첫 소스를 고르므로 이 순서가 중요하다. */}
            <source src={DEMO.mp4} type="video/mp4" />
            <source src={DEMO.webm} type="video/webm" />
          </video>

          {needsTap && !reduced && (
            <button
              type="button"
              onClick={tryPlay}
              aria-label={t("workspace.videoPlay")}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/30 transition-colors hover:bg-slate-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl">
                <Play className="ml-0.5 h-6 w-6 text-slate-900" fill="currentColor" />
              </span>
            </button>
          )}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc, detail }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-600/10 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500/60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/30">
                <Icon className="h-4.5 w-4.5 text-white" />
              </div>
              <h3 className="mt-3.5 text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{desc}</p>
              <div className="grid grid-rows-[0fr] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p className="mt-3 text-sm leading-relaxed text-blue-600 dark:text-blue-400">{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
