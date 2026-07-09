import Link from "next/link";
import { Sparkles, RefreshCw, Zap, ShieldCheck, LayoutGrid } from "lucide-react";
import { ALL_RELEASES_URL } from "@/lib/constants";
import DownloadCta from "@/components/landing/DownloadCta";
import ModeShowcase from "@/components/landing/ModeShowcase";
import PainPoints from "@/components/landing/PainPoints";
import ToolShowcase from "@/components/landing/ToolShowcase";
import CloudSyncDemo from "@/components/landing/CloudSyncDemo";
import HowItWorks from "@/components/landing/HowItWorks";
import Faq from "@/components/landing/Faq";

const HIGHLIGHTS = [
  {
    icon: LayoutGrid,
    title: "모드별 도구 10종",
    desc: "직장인 5종, 학생 5종. 각 상황에 맞게 설계된 전용 도구만 모아뒀습니다.",
    detail: "여기에 두 모드 어디서나 쓸 수 있는 AI 채팅까지 더해져 있습니다.",
  },
  {
    icon: RefreshCw,
    title: "끊김 없는 작업 흐름",
    desc: "맥북에서 데스크톱까지, 기기를 바꿔도 작업 환경과 기록이 실시간으로 동일하게 유지됩니다.",
    detail: "로그인만 하면 대화, 생성 결과물, 설정까지 모두 그대로 이어집니다.",
  },
  {
    icon: Zap,
    title: "세팅 대신 몰입",
    desc: "복잡한 초기 설정이나 API 키 발급 없이, 실행하는 순간 곧바로 작업에 집중할 수 있습니다.",
    detail: "구글 로그인 한 번이면 끝. 이후로는 화면 위 도구만 눌러 쓰면 됩니다.",
  },
  {
    icon: ShieldCheck,
    title: "데이터는 항상 안전하게",
    desc: "입력한 내용과 생성 결과는 로그인한 계정에만 연결된 클라우드에 보관됩니다.",
    detail: "히스토리는 언제든 다시 확인하거나 삭제할 수 있어요.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[24rem] w-[24rem] rounded-full bg-cyan-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-indigo-600/10 blur-[140px]" />

      {/* header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-50">
            AI 툴킷
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            Support
          </button>
          <a
            href={ALL_RELEASES_URL}
            className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            모든 버전 보기
          </a>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            로그인
          </Link>
        </div>
      </header>

      {/* hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center pt-14 pb-8 text-center sm:pt-20">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-1.5 text-xs font-medium text-violet-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            직장인과 학생, 각자에게 맞는 AI 데스크톱 앱
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            일도, 공부도
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              당신 속도에 맞게
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            직장인에게는 보고서와 문서 작업을, 학생에게는 강의 정리와 과제를.
            모드 하나만 고르면 필요한 도구가 바로 눈앞에 준비됩니다.
          </p>

          <DownloadCta />

          <p className="mt-4 text-xs text-slate-500">
            무료 · Windows 10/11 (64-bit) 및 macOS 지원
          </p>
        </section>

        {/* highlight grid */}
        <section className="grid gap-4 py-16 sm:grid-cols-2">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc, detail }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
              <div className="grid grid-rows-[0fr] transition-all duration-300 ease-out group-hover:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p className="mt-3 text-sm leading-relaxed text-violet-300/90">
                    {detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <ModeShowcase />

        <PainPoints />

        <ToolShowcase />

        <CloudSyncDemo />

        <HowItWorks />

        <Faq />
      </main>

      <footer className="relative z-10 border-t border-slate-800/60 py-8 text-center text-xs text-slate-600">
        <p>AI 툴킷 데스크톱 애플리케이션 · 클라우드 동기화 지원</p>
      </footer>
    </div>
  );
}
