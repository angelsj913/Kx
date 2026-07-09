import { Download, MousePointerClick, FileCheck } from "lucide-react";

const STEPS = [
  {
    icon: Download,
    title: "시작은 가볍게",
    desc: "번거로운 가입 절차 없이, 쓰던 계정 그대로 지금 바로 시작하세요.",
  },
  {
    icon: MousePointerClick,
    title: "원하는 기능 선택",
    desc: "학생·직장인 모드를 선택하고, 필요한 도구를 골라 내용을 입력하세요.",
  },
  {
    icon: FileCheck,
    title: "결과 확인 및 저장",
    desc: "AI가 만든 결과를 바로 확인하고, 복사하거나 파일로 저장해 활용하세요.",
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
          설치부터 결과 확인까지, 세 단계면 충분합니다.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
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
