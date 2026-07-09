import {
  Sparkles,
  Briefcase,
  GraduationCap,
  RefreshCw,
  Zap,
} from "lucide-react";
import { ALL_RELEASES_URL } from "@/lib/constants";
import DownloadCta from "@/components/landing/DownloadCta";
import HowItWorks from "@/components/landing/HowItWorks";
import Faq from "@/components/landing/Faq";

const FEATURES = [
  {
    icon: Briefcase,
    title: "직장인 모드",
    desc: "비즈니스 문서·이메일 작성부터 PPT 초안, 엑셀 보고서까지 업무에 필요한 도구를 한곳에 모았습니다.",
    detail: "보고서 요약 · 이메일 초안 · PPT 슬라이드 · 엑셀 표까지, 결과물 형태로 바로 받아보세요.",
  },
  {
    icon: GraduationCap,
    title: "학생 모드",
    desc: "강의 영상 요약, 수업 음성 자동 정리, 발표문·과제 작성까지 공부에 필요한 도구를 담았습니다.",
  },
  {
    icon: RefreshCw,
    title: "끊김 없는 작업 흐름",
    desc: "맥북에서 데스크톱까지, 기기를 바꿔도 당신의 작업 환경과 기록은 실시간으로 동일하게 유지됩니다.",
  },
  {
    icon: Zap,
    title: "세팅 대신 몰입",
    desc: "복잡한 초기 설정이나 도구 연결 과정은 필요 없습니다. 실행하는 순간 곧바로 작업에만 집중할 수 있습니다.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-600/10 blur-[140px]" />

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
        </div>
      </header>

      {/* hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center pt-14 pb-8 text-center sm:pt-20">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-1.5 text-xs font-medium text-violet-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            직장인과 학생을 위한 프리미엄 AI 데스크톱 앱
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            필요한 AI 도구,
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              한 곳에 모았습니다
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            직장인에게는 문서·PPT·엑셀을, 학생에게는 강의 요약·수업 정리·발표문
            작성을. 지금 데스크톱 앱을 내려받아 빠르고 안전하게 사용하세요.
          </p>

          <DownloadCta />

          <p className="mt-4 text-xs text-slate-500">
            무료 · Windows 10/11 (64-bit) 및 macOS 지원
          </p>
        </section>

        {/* feature grid */}
        <section className="grid gap-4 py-16 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, desc, detail }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
              {detail && (
                <div className="grid grid-rows-[0fr] transition-all duration-300 ease-out group-hover:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="mt-3 text-sm leading-relaxed text-violet-300/90">
                      {detail}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        <HowItWorks />

        <Faq />
      </main>

      <footer className="relative z-10 border-t border-slate-800/60 py-8 text-center text-xs text-slate-600">
        <p>Powered by Google Gemini · AI 툴킷 데스크톱 애플리케이션</p>
      </footer>
    </div>
  );
}
