"use client";

import { Briefcase, MessagesSquare, History, ArrowRight } from "lucide-react";
import type { View } from "@/components/Sidebar";

export default function Dashboard({
  onNavigate,
  historyCount,
}: {
  onNavigate: (v: View) => void;
  historyCount: number;
}) {
  const cards: {
    id: View;
    title: string;
    desc: string;
    icon: typeof Briefcase;
  }[] = [
    {
      id: "business",
      title: "비즈니스 말투 변환기",
      desc: "거칠거나 두서없는 글을 정중하고 세련된 비즈니스 톤 2가지 버전으로 변환합니다.",
      icon: Briefcase,
    },
    {
      id: "interview",
      title: "자소서 면접 질문 생성기",
      desc: "자소서를 분석해 압박 면접 질문 3가지와 STAR 기반 합격 답변 가이드를 제시합니다.",
      icon: MessagesSquare,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-violet-600/20 to-indigo-600/10 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          직장인·취준생을 위한 AI 툴킷 👋
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
          비즈니스 커뮤니케이션과 면접 준비를 도와주는 프리미엄 AI 데스크톱 앱입니다.
          아래에서 원하는 기능을 선택해 시작하세요.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map(({ id, title, desc, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className="group flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 text-left shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/50"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
              <Icon className="h-5.5 w-5.5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">
              {desc}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-violet-400 transition-transform duration-300 group-hover:translate-x-1">
              시작하기 <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onNavigate("history")}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 text-left shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:border-violet-500/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60">
            <History className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">마이 히스토리</h3>
            <p className="text-sm text-slate-400">
              저장된 작업 {historyCount.toLocaleString()}건 · 언제든 다시 복사하세요
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-500" />
      </button>
    </div>
  );
}
