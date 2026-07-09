"use client";

import { motion } from "framer-motion";
import { LayoutGrid, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import ExpandOnHover from "./ExpandOnHover";

const HIGHLIGHTS = [
  {
    icon: LayoutGrid,
    title: "모드별 도구 10종",
    desc: "직장인 5종, 학생 5종. 각 상황에 맞게 처음부터 다시 설계된 전용 도구만 모아뒀습니다.",
    detail: "두 모드 어디서나 꺼내 쓸 수 있는 AI 채팅까지 더해져 있어요.",
  },
  {
    icon: RefreshCw,
    title: "끊김 없는 작업 흐름",
    desc: "회사 PC에서 데스크톱까지, 기기를 바꿔도 작업 환경과 기록이 실시간으로 똑같이 유지됩니다.",
    detail: "로그인만 하면 대화, 생성 결과물, 설정까지 전부 그대로 이어집니다.",
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
    detail: "히스토리는 언제든 다시 확인하거나 필요 없어지면 삭제할 수 있어요.",
  },
];

const cardMotion = {
  initial: "rest",
  whileHover: "hover",
  animate: "rest",
} as const;

export default function Highlights() {
  return (
    <section className="grid gap-4 py-16 sm:grid-cols-2">
      {HIGHLIGHTS.map(({ icon: Icon, title, desc, detail }) => (
        <motion.div
          key={title}
          {...cardMotion}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl shadow-black/30 backdrop-blur-md transition-colors duration-300 hover:border-violet-500/40"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
          <ExpandOnHover>
            <p className="text-violet-300/90">{detail}</p>
          </ExpandOnHover>
        </motion.div>
      ))}
    </section>
  );
}
