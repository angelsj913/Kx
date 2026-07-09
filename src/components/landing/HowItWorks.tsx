import { Download, LogIn, MousePointerClick, FileCheck } from "lucide-react";

const STEPS = [
  {
    icon: Download,
    title: "설치 파일을 내려받으세요",
    desc: "Windows와 macOS 모두 지원합니다. 사용 중인 운영체제에 맞는 파일을 받아 실행하면, 그 자리에서 바로 설치가 끝납니다.",
  },
  {
    icon: LogIn,
    title: "쓰던 구글 계정으로 로그인",
    desc: "별도 회원가입이나 비밀번호를 새로 만들 필요 없이, 이미 쓰고 있는 구글 계정으로 로그인만 하면 준비가 끝납니다.",
  },
  {
    icon: MousePointerClick,
    title: "모드를 고르고, 도구를 선택",
    desc: "직장인 또는 학생 모드를 고르면 화면 전체가 그 목적에 맞춰 바뀝니다. 지금 필요한 도구를 골라 내용을 입력하세요.",
  },
  {
    icon: FileCheck,
    title: "결과를 받고, 어디서든 이어서",
    desc: "완성된 결과는 바로 확인하고 내려받을 수 있어요. 다른 기기에서 같은 계정으로 로그인해도 대화와 결과물이 그대로 이어집니다.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            사용 방법
          </span>
        </h2>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          설치부터 결과 확인까지, 네 단계면 충분합니다.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-lg font-bold text-white shadow-lg shadow-violet-900/40">
                {i + 1}
              </div>
              <Icon className="h-5 w-5 text-violet-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-100">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
