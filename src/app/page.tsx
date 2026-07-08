import {
  Sparkles,
  Briefcase,
  MessagesSquare,
  History,
  ShieldCheck,
  Download,
  Apple,
} from "lucide-react";

// Installers are published as GitHub Release assets. Update the tag/asset names
// here if you change the release naming.
const REPO = "https://github.com/angelsj913/Kx";
const WINDOWS_DOWNLOAD_URL = `${REPO}/releases/latest/download/AI-Toolkit-Windows-Installer.exe`;
const MAC_DOWNLOAD_URL = `${REPO}/releases/latest/download/AI-Toolkit-Mac-Installer.dmg`;
const ALL_RELEASES_URL = `${REPO}/releases`;

const FEATURES = [
  {
    icon: Briefcase,
    title: "비즈니스 말투 변환기",
    desc: "거칠거나 두서없는 글을 이메일·슬랙에 어울리는 정중하고 세련된 비즈니스 톤 2가지 버전으로 즉시 변환합니다.",
  },
  {
    icon: MessagesSquare,
    title: "자소서 면접 질문 생성기",
    desc: "자기소개서를 현미경 분석해 날카로운 압박 면접 질문 3가지와 STAR 기반 합격 답변 가이드를 제시합니다.",
  },
  {
    icon: History,
    title: "로컬 히스토리 보관함",
    desc: "생성한 모든 결과가 앱에 자동 저장되어, 언제든 다시 열어보고 복사하거나 TXT 파일로 내보낼 수 있습니다.",
  },
  {
    icon: ShieldCheck,
    title: "안전한 데스크톱 실행",
    desc: "API 키는 앱 내부 서버에서만 사용되어 외부로 노출되지 않습니다. 브라우저 주소창 없는 독립 실행형 프로그램입니다.",
  },
];

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

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
        <a
          href={ALL_RELEASES_URL}
          className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
        >
          모든 버전 보기
        </a>
      </header>

      {/* hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center pt-14 pb-8 text-center sm:pt-20">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-1.5 text-xs font-medium text-violet-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            직장인 · 취준생을 위한 프리미엄 AI 데스크톱 앱
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            생각을 정리하는 순간,
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              프로의 문장이 됩니다
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            비즈니스 말투 변환과 면접 질문 생성을 한 곳에서. 지금 데스크톱 앱을
            내려받아 오프라인 창에서 빠르고 안전하게 사용하세요.
          </p>

          {/* download buttons */}
          <div className="mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href={WINDOWS_DOWNLOAD_URL}
              className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-violet-900/40 transition-all duration-300 hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
            >
              <WindowsIcon className="h-6 w-6" />
              <span className="flex flex-col items-start leading-none">
                <span className="text-[11px] font-normal text-violet-200">
                  Windows용 설치 파일
                </span>
                Windows 다운로드
              </span>
              <Download className="ml-1 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
            <a
              href={MAC_DOWNLOAD_URL}
              className="group flex flex-1 items-center justify-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/50 px-7 py-4 text-base font-semibold text-slate-100 shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/50 active:scale-[0.98]"
            >
              <Apple className="h-6 w-6" />
              <span className="flex flex-col items-start leading-none">
                <span className="text-[11px] font-normal text-slate-400">
                  macOS용 설치 파일
                </span>
                Mac 다운로드
              </span>
              <Download className="ml-1 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            무료 · Windows 10/11 (64-bit) 및 macOS 지원
          </p>
        </section>

        {/* feature grid */}
        <section className="grid gap-4 py-16 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800/60 py-8 text-center text-xs text-slate-600">
        <p>Powered by Google Gemini · AI 툴킷 데스크톱 애플리케이션</p>
      </footer>
    </div>
  );
}
