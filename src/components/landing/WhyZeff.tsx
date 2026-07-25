"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  FileSpreadsheet,
  Layers,
  FileText,
  Presentation,
  Table2,
  MessageSquare,
  Sparkles,
  Link2,
  Play,
} from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";
import { useScrollProgress, stickySceneIndex, sceneLocalProgress } from "@/lib/landingScroll";

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

const RAIL_ICONS = [Video, FileSpreadsheet, Layers];

/** 실제 앱 강의 영상 요약 UI를 닮은 목업 (막대그래프 placeholder 대체) */
function PanelLecture({ progress = 0.7 }: { progress?: number }) {
  const wave = [28, 52, 38, 72, 88, 58, 44, 78, 48, 82, 62, 36, 54, 76, 58, 32];
  const active = Math.floor(progress * wave.length);
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/50">
        <Link2 className="h-3.5 w-3.5 text-blue-600" />
        <span className="flex-1 truncate text-[11px] text-slate-500">youtube.com/watch?v=…</span>
        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-semibold text-white">분석</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-800">
          <Play className="h-6 w-6 text-white/90" fill="currentColor" />
          <span className="absolute left-2 top-2 rounded bg-black/45 px-1.5 py-0.5 text-[8px] text-white/90">판서</span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
            <div className="h-full bg-blue-500" style={{ width: `${Math.max(12, progress * 100)}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">한 장 노트</p>
          <ul className="mt-2 space-y-1.5 text-[10px] leading-snug text-slate-600 dark:text-slate-300">
            <li className="rounded bg-slate-50 px-1.5 py-1 dark:bg-slate-800/70">학습 목표 2–3개 추출</li>
            <li className="rounded bg-slate-50 px-1.5 py-1 dark:bg-slate-800/70">판서 + 설명 병합</li>
            <li className="rounded bg-slate-50 px-1.5 py-1 dark:bg-slate-800/70">복습 질문 자동 생성</li>
          </ul>
        </div>
      </div>
      <div className="flex h-9 items-end gap-[2px] rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-slate-900/40">
        {wave.map((h, i) => (
          <span
            key={i}
            className={`w-full rounded-full ${i < active ? "bg-blue-500/80" : "bg-slate-200 dark:bg-slate-700"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-500">비전(화면) + 음성 → 구조화 노트</p>
    </div>
  );
}

function PanelDocs() {
  const icons = [FileText, Presentation, Table2];
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      {icons.map((Icon, i) => (
        <div
          key={i}
          className="landing-card flex w-full max-w-xs items-center gap-3 rounded-xl p-3"
          style={{ transform: `translateX(${(i - 1) * 12}px) rotate(${(i - 1) * 3}deg)` }}
        >
          <Icon className="h-5 w-5 text-blue-600" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-3/4 rounded bg-slate-300 dark:bg-slate-600" />
            <div className="h-1.5 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelUnified() {
  const tiles = [MessageSquare, Sparkles, FileText, Presentation, Table2, Video];
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {tiles.map((Icon, i) => (
        <div
          key={i}
          className={`flex aspect-square items-center justify-center rounded-xl border ${
            i === 0 ? "border-blue-500 bg-blue-600/10" : "border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/40"
          }`}
        >
          <Icon className={`h-5 w-5 ${i === 0 ? "text-blue-600" : "text-slate-400"}`} />
        </div>
      ))}
    </div>
  );
}

export default function WhyZeff() {
  const copy = useLocalCopy(COPY);
  const { sectionRef, p, reducedMotion } = useScrollProgress<HTMLElement>({ topOffset: 72 });
  const count = copy.pillars.length;
  const prevIdx = useRef(0);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const next = stickySceneIndex(p, count, 0.1, prevIdx.current);
    prevIdx.current = next;
    setIdx(next);
  }, [p, count]);

  const localP = sceneLocalProgress(p, count, idx);
  const lineFill = Math.min(100, (p / Math.max(0.001, (count - 1) / count)) * 100);

  if (reducedMotion) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">{copy.eyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{copy.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{copy.subtitle}</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {copy.pillars.map((pItem, i) => {
              const PIcon = RAIL_ICONS[i]!;
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
    <section ref={sectionRef} className="relative h-[360vh]">
      <div className="sticky top-0 flex min-h-[100svh] items-center py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">{copy.eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">{copy.title}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{copy.subtitle}</p>
          </div>

          <div className="grid items-stretch gap-8 lg:grid-cols-[240px_1fr]">
            <div className="relative hidden lg:block">
              <div className="absolute bottom-2 left-[1.125rem] top-2 w-px bg-slate-200 dark:bg-slate-700" />
              <div
                className="absolute left-[1.125rem] top-2 w-px origin-top bg-blue-600 dark:bg-blue-400"
                style={{ height: `${lineFill}%` }}
              />
              <ol className="space-y-10">
                {copy.pillars.map((pillar, i) => {
                  const Icon = RAIL_ICONS[i]!;
                  const active = i === idx;
                  return (
                    <li key={pillar.title} className={`flex gap-4 transition-opacity ${active ? "opacity-100" : "opacity-45"}`}>
                      <span
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                          active
                            ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                            : "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{pillar.title}</p>
                        {active && <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{pillar.desc}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="landing-card min-h-[18rem] overflow-hidden rounded-2xl shadow-lg"
            >
              <div className="border-b border-slate-200/80 px-5 py-3 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{copy.pillars[idx]!.title}</p>
                <p className="mt-1 text-xs text-slate-500 lg:hidden">{copy.pillars[idx]!.desc}</p>
              </div>
              {idx === 0 && <PanelLecture progress={localP} />}
              {idx === 1 && <PanelDocs />}
              {idx === 2 && <PanelUnified />}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
