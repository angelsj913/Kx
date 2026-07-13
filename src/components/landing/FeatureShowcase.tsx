"use client";

import { motion } from "framer-motion";
import { FileText, ListChecks, Lightbulb, StickyNote, Play, Presentation } from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";

type Item = { no: string; tag: string; title: string; desc: string };

const COPY: { ko: { title: string; subtitle: string; items: Item[] }; en: { title: string; subtitle: string; items: Item[] } } = {
  ko: {
    title: "이럴 때, Zeff",
    subtitle: "화면 안에서 실제로 매일 쓰이는 기능만 골라 담았습니다.",
    items: [
      {
        no: "01",
        tag: "AI 요약",
        title: "자료를 넣으면, 핵심만 남습니다",
        desc: "수업 자료나 PDF를 올리면 시험에 나올 법한 핵심을 정리해 요약본으로 돌려줍니다. 요약 옆의 퀴즈·개념·메모 탭으로 복습까지 자연스럽게 이어집니다.",
      },
      {
        no: "02",
        tag: "강의 분석",
        title: "영상과 음성을, 한 장의 노트로",
        desc: "강의 영상 링크 하나면 충분합니다. 화면 속 판서와 말소리를 함께 읽어 하나의 정리된 노트로 묶어 드립니다.",
      },
      {
        no: "03",
        tag: "문서 · 발표자료",
        title: "핵심만 던지면, 초안이 완성됩니다",
        desc: "필요한 내용만 알려 주면 워드 문서와 발표용 슬라이드 초안을 만들어 드립니다. 표와 서식까지 고려해, 받은 그대로 다듬어 쓰기 좋습니다.",
      },
    ],
  },
  en: {
    title: "This is where Zeff fits",
    subtitle: "We picked only the features people actually reach for every day.",
    items: [
      {
        no: "01",
        tag: "AI Summary",
        title: "Drop in the material, keep only what matters",
        desc: "Upload lecture notes or a PDF and get back a summary of the points most likely to show up on a test. Quiz, concept, and memo tabs sit right beside it, so review flows on naturally.",
      },
      {
        no: "02",
        tag: "Lecture Analysis",
        title: "Video and audio, into a single note",
        desc: "One lecture link is enough. Zeff reads the writing on screen and the spoken words together and ties them into one organized note.",
      },
      {
        no: "03",
        tag: "Docs · Slides",
        title: "Give the gist, get a draft",
        desc: "Tell it just what you need and get a draft of a Word document and a presentation deck — formatting and tables accounted for, ready to polish as-is.",
      },
    ],
  },
};

function MockSummary() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
      </div>
      <div className="grid grid-cols-2 gap-3 p-3">
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-2 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {[FileText, ListChecks, Lightbulb, StickyNote].map((Icon, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                  i === 0
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Icon className="h-2.5 w-2.5" />
              </span>
            ))}
          </div>
          <div className="h-2 w-full rounded bg-blue-200 dark:bg-blue-500/30" />
          <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

function MockLecture() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="relative flex aspect-video items-center justify-center bg-slate-900">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900">
          <Play className="h-4 w-4 translate-x-[1px]" />
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white">
          12:04
        </span>
      </div>
      <div className="space-y-1.5 p-3">
        <div className="h-2 w-1/2 rounded bg-slate-300 dark:bg-slate-700" />
        <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function MockDocs() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="h-2 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <Presentation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

const MOCKS = [MockSummary, MockLecture, MockDocs];

export default function FeatureShowcase() {
  const copy = useLocalCopy(COPY);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-slate-50 py-20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      {/* 위 요금제 섹션에서 이어지는 상단 페이드 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/0 via-white/40 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent"
      />
      {/* 아래 「만드는 사람들」과 경계 없이 이어지는 하단 페이드 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950"
      />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {copy.items.map((item, i) => {
            const Mock = MOCKS[i];
            const reversed = i % 2 === 1;
            return (
              <motion.div
                key={item.no}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="grid items-center gap-8 md:grid-cols-2"
              >
                <div className={reversed ? "md:order-2" : ""}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400">
                      {item.no}
                    </span>
                    <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                    {item.desc}
                  </p>
                </div>
                <div className={reversed ? "md:order-1" : ""}>
                  <Mock />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
