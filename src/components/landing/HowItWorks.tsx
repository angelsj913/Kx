"use client";

import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";

type LocalCopy = {
  eyebrow: string;
  title: string;
  body: string;
  steps: Array<{ n: string; title: string; body: string }>;
};

const COPY: Partial<Record<LandingLanguage, LocalCopy>> & { en: LocalCopy } = {
  ko: {
    eyebrow: "How it works",
    title: "세 단계면 충분합니다",
    body: "복잡한 온보딩 없이, 열고 · 올리고 · 이어서 쓰는 흐름입니다.",
    steps: [
      {
        n: "01",
        title: "웹에서 바로 시작",
        body: "설치 없이 /app으로 들어가 채팅과 워크스페이스를 엽니다.",
      },
      {
        n: "02",
        title: "자료와 맥락을 붙이기",
        body: "문서·음성·웹 조사를 AI에 붙여 한 스레드에서 이어 갑니다.",
      },
      {
        n: "03",
        title: "결과물로 내보내기",
        body: "요약·초안·노트를 다음 작업이나 공유용으로 바로 사용합니다.",
      },
    ],
  },
  en: {
    eyebrow: "How it works",
    title: "Three steps. That’s it.",
    body: "Open, attach context, keep shipping — no long onboarding.",
    steps: [
      {
        n: "01",
        title: "Start on the web",
        body: "Jump into /app — chat and workspace, no install required.",
      },
      {
        n: "02",
        title: "Attach your materials",
        body: "Docs, audio, and web research stay in one thread with the AI.",
      },
      {
        n: "03",
        title: "Ship the output",
        body: "Use summaries, drafts, and notes in the next step of your work.",
      },
    ],
  },
};

export function HowItWorks() {
  const c = useLocalCopy(COPY);

  return (
    <section id="how-it-works" className="border-b border-slate-200/80 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{c.eyebrow}</p>
          <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{c.body}</p>
        </div>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {c.steps.map((step) => (
            <li key={step.n} className="relative">
              <p className="font-[family-name:var(--font-landing-display)] text-4xl font-semibold tabular-nums text-blue-600/90">
                {step.n}
              </p>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
