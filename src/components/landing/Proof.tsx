"use client";

import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";

type LocalCopy = { eyebrow: string; title: string; body: string; items: string[] };

const COPY: Partial<Record<LandingLanguage, LocalCopy>> & { en: LocalCopy } = {
  ko: {
    eyebrow: "실제로 쓰는 장면",
    title: "채팅에서 끝나지 않고, 작업물로 남습니다",
    body: "강의 요약, 문서 초안, 자료 정리까지 — 한 워크스페이스에서 결과물을 이어 갑니다.",
    items: [
      "강의·미팅 음성을 구조화된 노트로",
      "긴 문서를 읽기 쉬운 요약·초안으로",
      "웹 조사와 출처를 붙인 리서치 답변으로",
    ],
  },
  en: {
    eyebrow: "In the workflow",
    title: "Not just chat — work that sticks",
    body: "Lecture notes, drafts, and research stay in one workspace so you can keep going.",
    items: [
      "Lecture and meeting audio into structured notes",
      "Long documents into readable summaries and drafts",
      "Web research answers with sources attached",
    ],
  },
};

export function Proof() {
  const c = useLocalCopy(COPY);

  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-[#f4f7fb] py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 10% 20%, rgba(37,99,235,0.08), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(14,165,233,0.07), transparent 50%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{c.eyebrow}</p>
          <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">{c.body}</p>
        </div>
        <ul className="space-y-4">
          {c.items.map((item) => (
            <li key={item} className="flex gap-3 text-base leading-relaxed text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Proof;
