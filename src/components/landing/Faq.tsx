import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "정말 무료인가요?",
    a: "네, 무료입니다. 다운로드부터 열 가지 도구 전부, 별도 결제 없이 이용할 수 있어요. 카드 등록도 필요 없습니다.",
  },
  {
    q: "회원가입이 꼭 필요한가요?",
    a: "번거로운 가입 절차 없이, 이미 쓰고 있는 구글 계정으로 로그인만 하면 바로 시작할 수 있어요. 로그인해두면 어떤 기기에서 접속하든 대화와 결과물이 그대로 이어집니다.",
  },
  {
    q: "제가 입력한 내용은 안전하게 보관되나요?",
    a: "로그인한 계정에 연결된 클라우드에 안전하게 저장되고, 로그인한 본인 외에는 접근할 수 없습니다. 히스토리 화면에서 언제든 지난 기록을 확인하거나, 필요 없어지면 직접 삭제할 수도 있어요.",
  },
  {
    q: "학생 모드와 직장인 모드, 둘 다 쓸 수 있나요?",
    a: "네, 한 계정으로 두 모드를 자유롭게 오갈 수 있어요. 상단에서 모드를 바꾸면 도구 목록과 화면 색감까지 그 자리에서 전환되니, 낮엔 업무용으로 밤엔 학습용으로 써도 전혀 문제없습니다.",
  },
  {
    q: "만든 문서(PPT, 엑셀 등)는 어디서 받나요?",
    a: "생성이 끝나면 화면에서 바로 다운로드할 수 있고, 히스토리에도 함께 저장돼서 나중에 다시 찾아 받을 수 있어요. 파일 자체도 계정과 함께 클라우드에 보관되니 컴퓨터를 바꿔도 걱정 없습니다.",
  },
  {
    q: "어떤 컴퓨터에서 쓸 수 있나요?",
    a: "Windows 10/11과 macOS에서 사용할 수 있어요. 위쪽 다운로드 버튼을 누르면 사용 중인 운영체제에 맞는 설치 파일을 바로 받을 수 있습니다.",
  },
  {
    q: "인터넷 연결이 꼭 필요한가요?",
    a: "네, AI 응답 생성과 클라우드 동기화 모두 인터넷 연결을 전제로 동작해요. 로그인 상태만 유지되면 그다음은 자동으로 처리되니 따로 신경 쓸 부분은 없습니다.",
  },
  {
    q: "기기를 바꿔도 작업 내용이 유지되나요?",
    a: "네, 같은 계정으로 로그인하면 이전 대화와 생성 결과물이 실시간으로 동기화돼서 그대로 이어집니다. 회사 PC에서 시작한 작업을 집 노트북에서 마무리하는 것도 자연스럽게 가능해요.",
  },
  {
    q: "AI 답변 품질이 매번 들쭉날쭉하지는 않나요?",
    a: "하나의 요청을 여러 AI 모델이 순서대로 처리하도록 설계돼 있어서, 특정 모델이 잠깐 불안정해도 자동으로 다음 모델이 이어받아 응답을 완성합니다. 어떤 모델이 실제로 답했는지는 신경 쓰지 않으셔도 되고, 결과의 완성도만 확인하시면 됩니다.",
  },
  {
    q: "회사나 학교 소속 구글 계정으로도 로그인할 수 있나요?",
    a: "네, 개인 계정이든 조직에서 발급받은 구글 워크스페이스 계정이든 구글 로그인을 지원하는 계정이라면 문제없이 사용할 수 있어요.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            자주 묻는 질문
          </span>
        </h2>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          더 궁금한 점이 있다면 헤더의 Support에서 바로 문의할 수 있어요.
        </p>
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
