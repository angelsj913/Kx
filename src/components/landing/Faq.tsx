import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "정말 무료인가요?",
    a: "네, 무료로 제공됩니다. 다운로드부터 기능 이용까지 별도 비용이 들지 않습니다.",
  },
  {
    q: "제가 입력한 내용이 밖으로 새어나가지 않나요?",
    a: "입력하신 내용은 프로그램 안에서 처리되며, 동의 없이 외부로 보내지 않습니다.",
  },
  {
    q: "어떤 컴퓨터에서 쓸 수 있나요?",
    a: "Windows 10/11과 Mac에서 사용할 수 있습니다. 다운로드 버튼을 누르면 사용하는 컴퓨터에 맞는 파일을 고를 수 있습니다.",
  },
  {
    q: "인터넷 연결이 필요한가요?",
    a: "네, AI 기능을 쓰려면 인터넷 연결이 필요합니다. 처음 한 번만 간단히 설정하면 이후에는 자동으로 이어집니다.",
  },
  {
    q: "기기를 변경해도 데이터가 유지되나요?",
    a: "네, 계정 연동을 통해 모든 작업 기록이 실시간으로 안전하게 동기화됩니다. 어떤 기기에서 접속하든 언제나 동일한 환경을 제공합니다.",
  },
];

export default function Faq() {
  return (
    <section className="py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            자주 묻는 질문
          </span>
        </h2>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {FAQS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl shadow-black/30 backdrop-blur-md open:border-violet-500/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-slate-100 [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
