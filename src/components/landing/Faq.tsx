import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "정말 무료인가요?",
    a: "네, 무료입니다. 다운로드부터 모든 도구 사용까지 별도 비용 없이 이용할 수 있어요.",
  },
  {
    q: "회원가입이 꼭 필요한가요?",
    a: "구글 계정으로 로그인만 하면 바로 시작할 수 있어요. 로그인해두면 어떤 기기에서 접속하든 대화와 결과물이 그대로 이어집니다.",
  },
  {
    q: "제가 입력한 내용은 안전하게 보관되나요?",
    a: "로그인한 계정에 연결된 클라우드에 안전하게 저장됩니다. 로그인한 본인 외에는 접근할 수 없고, 언제든 히스토리에서 확인하거나 삭제할 수 있어요.",
  },
  {
    q: "학생 모드와 직장인 모드, 둘 다 쓸 수 있나요?",
    a: "네, 한 계정으로 두 모드를 자유롭게 오갈 수 있어요. 상단에서 모드를 바꾸면 도구 목록과 화면 테마가 그 자리에서 전환됩니다.",
  },
  {
    q: "만든 문서(PPT, 엑셀 등)는 어디서 받나요?",
    a: "생성이 끝나면 바로 다운로드할 수 있고, 히스토리에도 저장되어 언제든 다시 받을 수 있어요. 파일도 계정과 함께 클라우드에 보관됩니다.",
  },
  {
    q: "어떤 컴퓨터에서 쓸 수 있나요?",
    a: "Windows 10/11과 macOS에서 사용할 수 있어요. 다운로드 버튼을 누르면 사용 중인 운영체제에 맞는 설치 파일을 바로 받을 수 있습니다.",
  },
  {
    q: "인터넷 연결이 꼭 필요한가요?",
    a: "네, AI 기능과 클라우드 동기화 모두 인터넷 연결이 필요해요. 로그인 상태만 유지되면 그다음은 자동으로 처리됩니다.",
  },
  {
    q: "기기를 바꿔도 작업 내용이 유지되나요?",
    a: "네, 같은 계정으로 로그인하면 이전 대화와 생성 결과물이 실시간으로 동기화되어 그대로 이어집니다. 컴퓨터를 바꾸거나 재설치해도 걱정 없어요.",
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
