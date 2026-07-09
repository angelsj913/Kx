import { Sparkles } from "lucide-react";
import Header from "@/components/landing/Header";
import DownloadCta from "@/components/landing/DownloadCta";
import Highlights from "@/components/landing/Highlights";
import ModeShowcase from "@/components/landing/ModeShowcase";
import PainPoints from "@/components/landing/PainPoints";
import ToolShowcase from "@/components/landing/ToolShowcase";
import CloudSyncDemo from "@/components/landing/CloudSyncDemo";
import HowItWorks from "@/components/landing/HowItWorks";
import Faq from "@/components/landing/Faq";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[24rem] w-[24rem] rounded-full bg-cyan-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-indigo-600/10 blur-[140px]" />

      <Header />

      {/* hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center pt-14 pb-8 text-center sm:pt-20">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-1.5 text-xs font-medium text-violet-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            매일 반복되는 문서 작업, 이제 AI에게 맡기세요
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            쌓이는 업무와 과제,
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              이제 속도가 다릅니다
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            보고서 초안부터 회의록 정리까지, 강의 복습부터 레포트 초안까지.
            직장인과 학생 각각에게 맞춘 도구로, 매번 처음부터 다시 시작하지
            않아도 됩니다.
          </p>

          <DownloadCta />

          <p className="mt-4 text-xs text-slate-500">
            무료 · Windows 10/11 (64-bit) 및 macOS 지원
          </p>
        </section>

        <Highlights />

        <ModeShowcase />

        <PainPoints />

        <ToolShowcase />

        <CloudSyncDemo />

        <HowItWorks />

        <Faq />
      </main>

      <footer className="relative z-10 border-t border-slate-800/60 py-10 text-center text-xs text-slate-600">
        <p>AI 툴킷 데스크톱 애플리케이션 · 클라우드 동기화 지원</p>
        <p className="mt-1.5 text-slate-700">
          궁금한 점은 헤더의 Support 버튼을 눌러 언제든 문의해 주세요.
        </p>
      </footer>
    </div>
  );
}
