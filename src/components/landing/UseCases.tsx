"use client";

import Link from "next/link";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";

type LocalCopy = {
  eyebrow: string;
  title: string;
  body: string;
  work: { title: string; body: string; points: string[] };
  learn: { title: string; body: string; points: string[] };
  cta: string;
};

const COPY: Partial<Record<LandingLanguage, LocalCopy>> & { en: LocalCopy } = {
  ko: {
    eyebrow: "Use cases",
    title: "직장과 학습, 같은 워크스페이스",
    body: "업무 문서와 강의 자료를 한 곳에서 다루고, 바로 다음 행동으로 이어 갑니다.",
    work: {
      title: "직장·업무",
      body: "회의 메모, 보고서 초안, 리서치를 한 스레드에서.",
      points: ["문서 요약·초안", "웹 조사와 출처", "팀 공유용 정리"],
    },
    learn: {
      title: "강의·학습",
      body: "긴 강의와 노트를 구조화해 복습과 과제에 바로 씁니다.",
      points: ["음성·강의 요약", "핵심 개념 정리", "과제·발표 초안"],
    },
    cta: "웹에서 시작하기",
  },
  en: {
    eyebrow: "Use cases",
    title: "Work and learning, one workspace",
    body: "Office docs and lecture materials live together — then turn into the next action.",
    work: {
      title: "Work",
      body: "Meeting notes, report drafts, and research in one thread.",
      points: ["Summaries & drafts", "Web research with sources", "Share-ready cleanup"],
    },
    learn: {
      title: "Lectures & study",
      body: "Structure long lectures and notes for review and assignments.",
      points: ["Audio & lecture summaries", "Key concepts", "Assignment & talk drafts"],
    },
    cta: "Start on the web",
  },
};

export function UseCases() {
  const c = useLocalCopy(COPY);

  return (
    <section id="use-cases" className="relative overflow-hidden border-b border-slate-200/80 bg-slate-950 py-20 text-white sm:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 80% 20%, rgba(37,99,235,0.25), transparent 55%), radial-gradient(ellipse 40% 50% at 10% 90%, rgba(14,165,233,0.15), transparent 50%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300/90">{c.eyebrow}</p>
          <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">{c.body}</p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {[c.work, c.learn].map((block) => (
            <div key={block.title}>
              <h3 className="text-xl font-semibold text-white">{block.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">{block.body}</p>
              <ul className="mt-6 space-y-3">
                {block.points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm text-slate-200 sm:text-base">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50"
          >
            {c.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default UseCases;
