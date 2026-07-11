"use client";

import { motion } from "framer-motion";
import { Compass, HeartHandshake, Rocket } from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";

const FOUNDER_NAME = "KWON SEUNGJUN";
const FOUNDER_INITIAL = "K";

type Value = { title: string; desc: string };

const COPY: {
  ko: { title: string; subtitle: string; role: string; bio: string; valuesTitle: string; values: Value[] };
  en: { title: string; subtitle: string; role: string; bio: string; valuesTitle: string; values: Value[] };
} = {
  ko: {
    title: "만드는 사람들",
    subtitle: "작지만, 제품을 매일 직접 쓰는 사람들이 만듭니다.",
    role: "대표 · Founder",
    bio: "'복잡한 일을 가장 단순하게'라는 생각 하나로 Zeff를 시작했습니다. 매주 사용자의 목소리를 직접 읽고, 다음 주 제품에 반영하는 일을 가장 중요하게 여깁니다.",
    valuesTitle: "일하는 원칙",
    values: [
      { title: "결과로 증명합니다", desc: "말보다 쓰임으로 보여드립니다. 화면 속에서 실제로 동작하는 것만 약속합니다." },
      { title: "사용자 곁에서 고칩니다", desc: "매주 피드백을 검토하고, 불편한 지점을 가장 먼저 마주해 다음 주에 다듬습니다." },
      { title: "멈추지 않고 나아갑니다", desc: "서두르지 않되, 그리는 방향으로 꾸준히 한 걸음씩 나아갑니다." },
    ],
  },
  en: {
    title: "The people behind it",
    subtitle: "A small team — and the people who build it use it every day.",
    role: "Founder",
    bio: "Zeff started from a single idea: make complex work as simple as possible. Reading real user feedback every week and folding it into the next week's product is what we care about most.",
    valuesTitle: "How we work",
    values: [
      { title: "Prove it through results", desc: "We show it through use, not talk. We only promise what actually works on screen." },
      { title: "Fix it beside our users", desc: "We review feedback weekly, meet the rough edges first, and smooth them out the week after." },
      { title: "Keep moving forward", desc: "Without rushing, we take steady steps toward the picture we're drawing." },
    ],
  },
};

const VALUE_ICONS = [Rocket, HeartHandshake, Compass];

export default function Team() {
  const copy = useLocalCopy(COPY);

  return (
    <section className="bg-slate-50 py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
            {copy.subtitle}
          </p>
        </div>

        {/* 대표 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-5 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:flex-row sm:text-left dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-3xl font-extrabold text-white shadow-lg shadow-blue-600/30">
            {FOUNDER_INITIAL}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{FOUNDER_NAME}</p>
            <p className="mt-0.5 text-sm font-medium text-blue-600 dark:text-blue-400">{copy.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{copy.bio}</p>
          </div>
        </motion.div>

        {/* 일하는 원칙 */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {copy.values.map((v, i) => {
            const Icon = VALUE_ICONS[i];
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{v.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
