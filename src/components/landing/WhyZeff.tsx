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
    title: "공부만? ZEFF는 공부와 일까지 한곳에서",
    subtitle: "요약·문제 생성은 기본. 여기에 학습 전용 도구엔 없는 강의 영상 분석과 문서·발표자료 자동 생성까지 더했습니다.",
    pillars: [
      { title: "강의 영상·음성 분석", desc: "링크 하나면 화면 속 판서와 말소리를 함께 읽어 한 장의 정리 노트로 묶어 줍니다." },
      { title: "워드·PPT·엑셀 자동 생성", desc: "핵심만 알려 주면 발표자료·보고서·표 초안을 만들어 우측 패널에서 바로 확인합니다." },
      { title: "공부 + 업무 올인원", desc: "시험 준비부터 실무 문서까지, 서비스를 갈아타지 않고 하나의 워크스페이스에서 끝냅니다." },
    ],
  },
  en: {
    eyebrow: "Why ZEFF",
    title: "Not just studying — study and work, in one place",
    subtitle: "Summaries and quizzes are table stakes. ZEFF adds lecture-video analysis and one-click document generation that study-only tools don't have.",
    pillars: [
      { title: "Lecture video & audio analysis", desc: "One link and ZEFF reads the on-screen writing and the spoken words together into a single organized note." },
      { title: "Word · PPT · Excel generation", desc: "Give the gist and get slide, report, and spreadsheet drafts — previewed right in the side panel." },
      { title: "Study + work, all in one", desc: "From exam prep to real work documents, finish it all in one workspace instead of switching apps." },
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
