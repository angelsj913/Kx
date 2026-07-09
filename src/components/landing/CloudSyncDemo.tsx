"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudUpload, CloudCheck, ShieldCheck, RefreshCw, Laptop } from "lucide-react";

type SaveState = "idle" | "saving" | "saved";

const CYCLE: { state: SaveState; hold: number }[] = [
  { state: "idle", hold: 1600 },
  { state: "saving", hold: 1400 },
  { state: "saved", hold: 2600 },
];

function StatusPill({ state }: { state: SaveState }) {
  if (state === "idle") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
        대화 진행 중
      </span>
    );
  }
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
        저장 중...
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
      <CloudCheck className="h-3.5 w-3.5" />
      클라우드에 저장 완료
    </span>
  );
}

export default function CloudSyncDemo() {
  const [step, setStep] = useState(0);
  const state = CYCLE[step % CYCLE.length].state;

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep((s) => s + 1);
    }, CYCLE[step % CYCLE.length].hold);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <section className="py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          입력하는 순간, 이미 저장되고 있습니다
        </h2>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          채팅도, 생성한 문서도 자동으로 클라우드에 올라갑니다. 창을 닫아도, 다른 기기로
          옮겨가도 그대로 이어집니다.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/70 shadow-2xl shadow-black/40 backdrop-blur-md">
          {/* window chrome */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Laptop className="h-3.5 w-3.5" />
              AI 채팅
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={state}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
              >
                <StatusPill state={state} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* mock chat */}
          <div className="space-y-3 px-5 py-6">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-violet-900/30">
              다음 주 화요일 팀 미팅 안건 초안 좀 정리해줘
            </div>
            <div className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm leading-relaxed text-slate-200 shadow-lg shadow-black/20">
              네, 지난 회의록을 참고해서 안건 3가지로 정리해드릴게요. 예산 검토, 캠페인
              일정 조율, 신규 인력 배치 순으로 구성했습니다.
            </div>
          </div>

          {/* footer chips */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 px-5 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 px-3 py-1 text-[11px] font-medium text-slate-400">
              <CloudUpload className="h-3 w-3" />
              실시간 자동 저장
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 px-3 py-1 text-[11px] font-medium text-slate-400">
              <RefreshCw className="h-3 w-3" />
              기기 간 동기화
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 px-3 py-1 text-[11px] font-medium text-slate-400">
              <ShieldCheck className="h-3 w-3" />
              계정 기반 보안 저장
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
