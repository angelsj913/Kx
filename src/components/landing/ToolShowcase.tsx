import { MessagesSquare } from "lucide-react";
import { TOOLS, type AppMode } from "@/lib/tools";
import { LANDING_MODE_STYLE } from "@/lib/landingTheme";

/** 카드 앞면 설명(tool.description)은 항상 보이고, 아래 문구는 호버 시에만 펼쳐지는 보조 설명. */
const TOOL_DETAIL: Record<string, string> = {
  bizdoc: "정중한 버전과 유연한 실무 버전, 두 가지 톤으로 동시에 받아보고 상황에 맞게 고르세요.",
  ppt: "표지부터 마무리까지 슬라이드 구성이 잡힌 상태로, 발표자 대본까지 함께 나와요.",
  excel: "항목만 정하면 예시 데이터까지 채워진 표로 완성되어 바로 다듬어 쓸 수 있어요.",
  meeting: "날짜·참석자·안건은 물론, 담당자와 기한이 붙은 액션 아이템까지 자동으로 뽑아줘요.",
  "weekly-report": "이번 주 진행률은 슬라이더로, 다음 주 계획은 목록으로 깔끔하게 나눠 정리돼요.",
  lecture: "영상 링크 하나면 핵심 요약과 예상 질문까지, 시험 전 훑어보기에 딱이에요.",
  audio: "녹음 파일만 올리면 선생님 설명이 필기 형태로 정리되고, 안 들린 구간은 표시해줘요.",
  presentation: "서론·본론·결론이 갖춰진 완성된 대본이라 그대로 읽어도 자연스러워요.",
  "lecture-notes": "키워드만 보고 내용을 떠올리는 회상 노트라 진짜 복습에 도움이 돼요.",
  "research-draft": "섹션별 초안과 함께 참고할 자료 메모까지 붙어 있어 자료 조사 시간을 줄여줘요.",
};

function ToolGrid({ mode }: { mode: AppMode }) {
  const s = LANDING_MODE_STYLE[mode];
  const tools = TOOLS.filter((t) => t.appMode === mode);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${s.iconBg}`} />
        <h3 className={`text-sm font-semibold ${s.accentText}`}>{s.name} 전용 도구</h3>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {tools.map(({ id, icon: Icon, label, description }) => (
          <div
            key={id}
            className={`group rounded-2xl border ${s.border} bg-slate-800/40 p-5 shadow-lg shadow-black/20 backdrop-blur-md transition-colors duration-300 ${s.borderHover}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} shadow-md`}>
              <Icon className="h-4.5 w-4.5 text-white" />
            </div>
            <h4 className="mt-3.5 text-sm font-semibold text-slate-100">{label}</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{description}</p>

            <div className="grid grid-rows-[0fr] transition-all duration-300 ease-out group-hover:grid-rows-[1fr]">
              <div className="overflow-hidden">
                <p className={`mt-3 text-sm leading-relaxed ${s.accentText}`}>
                  {TOOL_DETAIL[id]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ToolShowcase() {
  return (
    <section className="py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          모드별 핵심 도구
        </h2>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          카드에 마우스를 올려보면 각 도구가 실제로 어떤 결과를 만들어내는지 확인할 수 있어요.
        </p>
      </div>

      <div className="mt-12 space-y-10">
        <ToolGrid mode="office" />
        <ToolGrid mode="student" />
      </div>

      <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/30 px-6 py-4 text-center backdrop-blur-md">
        <MessagesSquare className="h-5 w-5 shrink-0 text-violet-300" />
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-slate-100">AI 채팅</span>은 모드 구분 없이 언제든
          꺼내 쓸 수 있어요. 이미지·문서를 첨부하고, 원하는 페르소나로 편하게 대화하세요.
        </p>
      </div>
    </section>
  );
}
