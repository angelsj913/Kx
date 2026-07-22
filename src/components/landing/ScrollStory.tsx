"use client";

import Link from "next/link";
import { useScrollProgress } from "@/lib/landingScroll";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";

type Scene = { label: string; title: string; body: string };

type LocalCopy = {
  eyebrow: string;
  cta: string;
  scenes: [Scene, Scene, Scene];
};

const COPY: Partial<Record<LandingLanguage, LocalCopy>> & { en: LocalCopy } = {
  ko: {
    eyebrow: "스크롤로 이어지는 장면",
    cta: "요금제 보기",
    scenes: [
      {
        label: "01 · Workspace",
        title: "채팅과 파일이 한 화면에",
        body: "질문을 던지고, 자료는 옆에 둡니다. 맥락이 끊기지 않습니다.",
      },
      {
        label: "02 · Make",
        title: "요약이 초안이 되고, 초안이 PPT가 됩니다",
        body: "강의·문서에서 뽑은 핵심을 바로 발표·보고용으로 이어 씁니다.",
      },
      {
        label: "03 · Ship",
        title: "다음 행동은 요금제·시작으로",
        body: "필요할 때 웹에서 바로 열고, 용량이 필요하면 플랜을 고릅니다.",
      },
    ],
  },
  en: {
    eyebrow: "One scroll, one story",
    cta: "See pricing",
    scenes: [
      {
        label: "01 · Workspace",
        title: "Chat and files on one screen",
        body: "Ask beside your materials — context stays in the thread.",
      },
      {
        label: "02 · Make",
        title: "Summaries become drafts, drafts become decks",
        body: "Pull the essence from lectures and docs into slides and reports.",
      },
      {
        label: "03 · Ship",
        title: "Land on pricing — or just start",
        body: "Open the web app anytime; pick a plan when you need more room.",
      },
    ],
  },
};

function sceneIndex(p: number): number {
  if (p < 0.33) return 0;
  if (p < 0.66) return 1;
  return 2;
}

function SceneFrame({ index }: { index: number }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200 shadow-xl shadow-slate-900/10">
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: index === 0 ? 1 : 0 }}
        aria-hidden
      >
        <div className="absolute inset-4 grid grid-cols-[0.85fr_1.15fr] gap-3">
          <div className="rounded-xl bg-white/90 p-3 shadow-sm">
            <div className="h-2 w-14 rounded bg-slate-300" />
            <div className="mt-3 space-y-2">
              <div className="h-9 rounded-lg bg-blue-500/15 ring-1 ring-blue-500/25" />
              <div className="h-9 rounded-lg bg-slate-100" />
              <div className="h-9 rounded-lg bg-slate-100" />
            </div>
          </div>
          <div className="rounded-xl bg-slate-900 p-3 text-[10px] text-slate-300">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Chat</div>
            <div className="mt-2 ml-auto max-w-[80%] rounded-lg bg-blue-600 px-2 py-1.5 text-white">
              PDF 핵심만 정리해줘
            </div>
            <div className="mt-2 max-w-[90%] rounded-lg bg-slate-800 px-2 py-1.5">
              3개 섹션으로 요약했어요.
            </div>
          </div>
        </div>
      </div>
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: index === 1 ? 1 : 0 }}
        aria-hidden
      >
        <div className="absolute inset-4 flex flex-col gap-3">
          <div className="flex gap-2">
            {["Outline", "Slides", "Notes"].map((t, i) => (
              <span
                key={t}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium ${
                  i === 1 ? "bg-blue-600 text-white" : "bg-white/80 text-slate-600"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-lg bg-white/95 p-3 shadow-sm">
                <div className="h-2 w-10 rounded bg-slate-300" />
                <div className="mt-2 h-12 rounded bg-gradient-to-br from-sky-100 to-blue-50" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: index === 2 ? 1 : 0 }}
        aria-hidden
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
          <p className="font-[family-name:var(--font-landing-display)] text-2xl font-semibold text-white sm:text-3xl">
            ZEFF
          </p>
          <p className="max-w-xs text-sm text-slate-400">웹에서 시작하고, 필요할 때 플랜을 고르세요.</p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900">Start</span>
            <span className="rounded-lg border border-white/20 px-4 py-2 text-xs text-slate-200">Pricing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Phase C — 단일 스크롤 진행도 p로 Hero 이후 장면을 전환.
 * prefers-reduced-motion 이면 첫 장면 + 카피만 정적으로 노출.
 */
export default function ScrollStory() {
  const c = useLocalCopy(COPY);
  const { p, reducedMotion } = useScrollProgress({ rangeVh: 2.4 });
  const idx = sceneIndex(p);
  const scene = c.scenes[idx];

  if (reducedMotion) {
    return (
      <section id="story" className="border-b border-slate-200/80 bg-[#eef2f7] py-20 sm:py-24" aria-label={c.eyebrow}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{c.eyebrow}</p>
            <ul className="mt-8 space-y-8">
              {c.scenes.map((s) => (
                <li key={s.label}>
                  <p className="text-xs font-medium tracking-wide text-slate-500">{s.label}</p>
                  <h2 className="mt-1 font-[family-name:var(--font-landing-display)] text-2xl font-semibold text-slate-900">
                    {s.title}
                  </h2>
                  <p className="mt-2 text-base text-slate-600">{s.body}</p>
                </li>
              ))}
            </ul>
            <a
              href="#pricing"
              className="mt-10 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              {c.cta}
            </a>
          </div>
          <SceneFrame index={0} />
        </div>
      </section>
    );
  }

  return (
    <section
      id="story"
      className="relative border-b border-slate-200/80 bg-[#eef2f7]"
      style={{ height: "240vh" }}
      aria-label={c.eyebrow}
    >
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 75% 40%, rgba(37,99,235,0.12), transparent 55%), linear-gradient(180deg, #eef2f7 0%, #e8eef6 100%)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{c.eyebrow}</p>
            <p className="mt-4 text-xs font-medium tracking-wide text-slate-500">{scene.label}</p>
            <h2
              key={scene.title}
              className="mt-2 font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-slate-900 motion-safe:animate-[landing-fade-up_0.45s_ease-out] sm:text-4xl"
            >
              {scene.title}
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">{scene.body}</p>

            <div className="mt-8 flex items-center gap-3" aria-hidden>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-300/80">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.round(p * 100)}%` }}
                />
              </div>
              <span className="tabular-nums text-xs text-slate-500">{Math.round(p * 100)}%</span>
            </div>

            <div className="mt-8">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {c.cta}
              </a>
              <Link href="/app" className="ml-4 text-sm font-medium text-blue-700 underline-offset-4 hover:underline">
                /app
              </Link>
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
            style={{ transform: `translateY(${(0.5 - p) * 12}px)` }}
          >
            <SceneFrame index={idx} />
          </div>
        </div>
      </div>
    </section>
  );
}
