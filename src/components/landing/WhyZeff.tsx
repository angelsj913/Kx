"use client";

import { motion } from "framer-motion";
import { Video, FileSpreadsheet, Layers } from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";

type Pillar = { title: string; desc: string };
type Copy = { eyebrow: string; title: string; subtitle: string; pillars: [Pillar, Pillar, Pillar] };

// 경쟁 서비스(학습 전용 도구) 대비 차별점을 한 화면에 요약한다. 로컬 카피 + en 폴백.
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
    title: "勉強だけ？ ZEFF は勉強も仕事も一か所で",
    subtitle: "要約や問題作成は当たり前。学習専用ツールにはない講義動画の分析や資料の自動生成まで揃えました。",
    pillars: [
      { title: "講義の映像・音声を分析", desc: "リンク一つで画面の板書と話し声を一緒に読み取り、一枚の整理ノートにまとめます。" },
      { title: "Word・PPT・Excel を自動生成", desc: "要点を伝えれば資料・レポート・表の下書きを作成し、右パネルですぐ確認できます。" },
      { title: "勉強＋仕事のオールインワン", desc: "試験対策から実務資料まで、サービスを乗り換えず一つのワークスペースで完結します。" },
    ],
  },
  zh: {
    eyebrow: "为什么选 ZEFF",
    title: "不只是学习——学习和工作，都在一处",
    subtitle: "摘要与出题只是基础。ZEFF 还提供学习专用工具没有的讲座视频分析与文档一键生成。",
    pillars: [
      { title: "讲座视频·音频分析", desc: "只需一个链接，同时读取画面板书与讲话内容，整理成一份笔记。" },
      { title: "Word·PPT·Excel 自动生成", desc: "说出重点即可生成演示、报告、表格草稿，并在右侧面板即时预览。" },
      { title: "学习 + 工作 一体化", desc: "从备考到实务文档，无需切换应用，在一个工作区内完成。" },
    ],
  },
};

const ICONS = [Video, FileSpreadsheet, Layers];

export default function WhyZeff() {
  const copy = useLocalCopy(COPY);

  return (
    <section className="relative overflow-hidden bg-white py-20 dark:bg-slate-950">
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
            {copy.eyebrow}
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {copy.pillars.map((p, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-50">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
