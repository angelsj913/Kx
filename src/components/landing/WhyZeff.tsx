"use client";

import { motion } from "framer-motion";
import { Video, FileSpreadsheet, Layers } from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";
import { useScrollProgress, sceneIndex } from "@/lib/landingScroll";

type Pillar = { title: string; desc: string };
type Copy = { eyebrow: string; title: string; subtitle: string; pillars: [Pillar, Pillar, Pillar] };

const COPY: Partial<Record<LandingLanguage, Copy>> & { en: Copy } = {
  ko: {
    eyebrow: "왜 ZEFF인가",
    title: "공부부터 업무 문서까지, 한곳에서",
    subtitle: "강의 내용을 정리한 뒤 발표자료와 문서 초안까지 같은 흐름에서 만들 수 있습니다.",
    pillars: [
      { title: "강의 영상·음성 분석", desc: "링크를 붙여 넣으면 화면 속 판서와 설명을 읽어 한 장의 노트로 정리합니다." },
      { title: "워드·PPT·엑셀 초안", desc: "필요한 내용을 적으면 발표자료·보고서·표 초안을 만들고 우측 패널에서 바로 보여줍니다." },
      { title: "공부와 업무를 한곳에서", desc: "시험 준비부터 실무 문서까지, 작업마다 다른 서비스를 오갈 필요가 없습니다." },
    ],
  },
  en: {
    eyebrow: "Why ZEFF",
    title: "From studying to work documents, in one place",
    subtitle: "Organize a lecture, then continue with presentation and document drafts in the same workspace.",
    pillars: [
      { title: "Lecture video and audio", desc: "Paste a link and ZEFF turns the writing and spoken explanation into one organized note." },
      { title: "Word, PPT, and Excel drafts", desc: "Describe what you need, then review the document, slide, or spreadsheet draft in the side panel." },
      { title: "Study and work together", desc: "Move from exam preparation to everyday work without switching between separate services." },
    ],
  },
  ja: {
    eyebrow: "なぜ ZEFF か",
    title: "勉強も仕事も、ツールを乗り換えない",
    subtitle: "学習専用にはない講義分析と資料生成を、ひとつのワークスペースに。",
    pillars: [
      { title: "講義の映像・音声", desc: "リンク一つで板書と話し声を読み取り、整理ノートにまとめます。" },
      { title: "Word・PPT・Excel 下書き", desc: "要点を伝えれば資料・レポート・表の下書きをすぐ確認できます。" },
      { title: "勉強＋仕事のオールインワン", desc: "試験対策から実務資料まで、サービスを乗り換えず一つのワークスペースで完結します。" },
    ],
  },
  zh: {
    eyebrow: "为什么选 ZEFF",
    title: "学习与工作，不必换工具",
    subtitle: "讲座分析与文档生成——学习专用工具没有的能力，都在一个工作区。",
    pillars: [
      { title: "讲座视频·音频", desc: "一个链接：板书与讲话整理成结构化笔记。" },
      { title: "Word·PPT·Excel 草稿", desc: "说出重点，即可在侧栏预览演示、报告与表格草稿。" },
      { title: "学习 + 工作 一体化", desc: "从备考到实务文档，无需切换应用，在一个工作区内完成。" },
    ],
  },
};

const ICONS = [Video, FileSpreadsheet, Layers];

export default function WhyZeff() {
  const copy = useLocalCopy(COPY);
  const { sectionRef, p, reducedMotion } = useScrollProgress<HTMLElement>({ topOffset: 72 });
  const idx = sceneIndex(p, copy.pillars.length);
  const pillar = copy.pillars[idx]!;
  const Icon = ICONS[idx]!;

  if (reducedMotion) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">{copy.eyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{copy.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{copy.subtitle}</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {copy.pillars.map((pItem, i) => {
              const PIcon = ICONS[i]!;
              return (
                <div key={pItem.title} className="landing-card rounded-2xl p-6 text-left">
                  <PIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="mt-4 font-bold">{pItem.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pItem.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[240vh] py-0">
      <div className="sticky top-0 flex min-h-[100svh] items-center py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">{copy.eyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">{copy.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">{copy.subtitle}</p>

          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="landing-card mx-auto mt-12 max-w-lg rounded-2xl p-8 text-left"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{pillar.desc}</p>
          </motion.div>

          <div className="mt-8 flex justify-center gap-2" aria-hidden>
            {copy.pillars.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-blue-600" : "w-3 bg-slate-300 dark:bg-slate-700"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
