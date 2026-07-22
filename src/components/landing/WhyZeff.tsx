"use client";

import { Video, FileSpreadsheet } from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";

type Pillar = { title: string; desc: string };
type Copy = { eyebrow: string; title: string; subtitle: string; pillars: [Pillar, Pillar] };

const COPY: Partial<Record<LandingLanguage, Copy>> & { en: Copy } = {
  ko: {
    eyebrow: "왜 ZEFF인가",
    title: "공부와 일, 도구를 갈아타지 마세요",
    subtitle: "학습 전용 도구에 없는 강의 분석과 문서 생성을, 한 워크스페이스에 모았습니다.",
    pillars: [
      {
        title: "강의 영상·음성 분석",
        desc: "링크 하나로 판서와 말소리를 읽어 구조화된 노트로 묶습니다.",
      },
      {
        title: "워드·PPT·엑셀 초안",
        desc: "핵심만 알려 주면 발표·보고서·표 초안을 바로 확인합니다.",
      },
    ],
  },
  en: {
    eyebrow: "Why ZEFF",
    title: "Study and work — without switching tools",
    subtitle: "Lecture analysis and document generation that study-only apps don’t ship — in one workspace.",
    pillars: [
      {
        title: "Lecture video & audio",
        desc: "One link: on-screen writing and speech become structured notes.",
      },
      {
        title: "Word · PPT · Excel drafts",
        desc: "Give the gist; preview slide, report, and sheet drafts beside chat.",
      },
    ],
  },
  ja: {
    eyebrow: "なぜ ZEFF か",
    title: "勉強も仕事も、ツールを乗り換えない",
    subtitle: "学習専用にはない講義分析と資料生成を、ひとつのワークスペースに。",
    pillars: [
      {
        title: "講義の映像・音声",
        desc: "リンク一つで板書と話し声を読み取り、整理ノートにまとめます。",
      },
      {
        title: "Word・PPT・Excel 下書き",
        desc: "要点を伝えれば資料・レポート・表の下書きをすぐ確認できます。",
      },
    ],
  },
  zh: {
    eyebrow: "为什么选 ZEFF",
    title: "学习与工作，不必换工具",
    subtitle: "讲座分析与文档生成——学习专用工具没有的能力，都在一个工作区。",
    pillars: [
      {
        title: "讲座视频·音频",
        desc: "一个链接：板书与讲话整理成结构化笔记。",
      },
      {
        title: "Word·PPT·Excel 草稿",
        desc: "说出重点，即可在侧栏预览演示、报告与表格草稿。",
      },
    ],
  },
};

const ICONS = [Video, FileSpreadsheet];

export default function WhyZeff() {
  const copy = useLocalCopy(COPY);

  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-20 sm:py-24">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{copy.eyebrow}</p>
          <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{copy.subtitle}</p>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 sm:gap-12">
          {copy.pillars.map((p, i) => {
            const Icon = ICONS[i];
            return (
              <div key={p.title} className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
