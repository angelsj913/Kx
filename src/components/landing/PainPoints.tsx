import { Mail, ClipboardList, BarChart3, Presentation, Table2, Video, FileText, BookMarked, Mic } from "lucide-react";
import { LANDING_MODE_STYLE } from "@/lib/landingTheme";

const OFFICE_POINTS = [
  {
    icon: Mail,
    pain: "보고서 하나 쓰는데 문장 다듬느라 30분이 훌쩍 갑니다.",
    fix: "요지만 적으면 정중한 버전과 실무 톤 버전, 두 가지로 바로 완성",
  },
  {
    icon: ClipboardList,
    pain: "회의는 끝났는데 누가 뭘 언제까지 하기로 했는지 기억이 가물가물합니다.",
    fix: "담당자·기한까지 정리된 회의록으로 자동 변환",
  },
  {
    icon: BarChart3,
    pain: "주간 보고 쓸 때마다 지난주에 뭘 했는지부터 다시 뒤져봅니다.",
    fix: "진행률 슬라이더만 옮기면 끝나는 보고 양식",
  },
  {
    icon: Presentation,
    pain: "발표 슬라이드는 첫 장 구성부터 막혀서 자꾸 다음으로 미루게 됩니다.",
    fix: "표지부터 마무리까지, 발표자 대본까지 딸린 슬라이드 초안 완성",
  },
  {
    icon: Table2,
    pain: "엑셀 표 하나 만드는데 항목 잡고 서식 맞추는 데만 한참입니다.",
    fix: "요구사항만 입력하면 예시 데이터까지 채운 표로 바로 다운로드",
  },
];

const STUDENT_POINTS = [
  {
    icon: Video,
    pain: "놓친 강의를 처음부터 다시 돌려보느라 애꿎은 시간만 갑니다.",
    fix: "영상 링크 하나면 핵심과 복습 포인트만 골라 노트로 정리",
  },
  {
    icon: FileText,
    pain: "발표문은 첫 문장부터 막혀서 하얀 화면만 한참 쳐다봅니다.",
    fix: "주제만 넣으면 서론부터 결론까지, 발표 팁까지 함께 완성",
  },
  {
    icon: BookMarked,
    pain: "레포트 마감은 다가오는데 자료 정리부터 어디서 시작할지 막막합니다.",
    fix: "섹션별 초안과 참고할 자료 메모까지 한 번에 제안",
  },
  {
    icon: Mic,
    pain: "필기하느라 정작 선생님 설명은 절반도 못 들은 것 같습니다.",
    fix: "녹음 파일만 올리면 필기 형태로 정리하고, 못 들은 구간은 따로 표시",
  },
  {
    icon: BookMarked,
    pain: "시험 전날 노트를 펼쳐도 뭐가 중요했는지 다시 헷갈립니다.",
    fix: "키워드만 보고 내용을 떠올리는 능동 회상 노트로 정리",
  },
];

function Column({ mode, points }: { mode: "office" | "student"; points: typeof OFFICE_POINTS }) {
  const s = LANDING_MODE_STYLE[mode];
  return (
    <div className="space-y-4">
      <span className={`inline-flex items-center gap-1.5 rounded-full ${s.chipBg} px-3 py-1 text-xs font-semibold ${s.chipText}`}>
        {s.name}
      </span>
      {points.map(({ icon: Icon, pain, fix }) => (
        <div
          key={pain}
          className={`rounded-2xl border ${s.border} bg-slate-800/40 p-5 shadow-lg shadow-black/20 backdrop-blur-md transition-colors duration-300 ${s.borderHover}`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.iconBg} shadow-md`}>
              <Icon className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm leading-relaxed text-slate-300">{pain}</p>
              <p className={`mt-2 text-sm font-medium leading-relaxed ${s.accentText}`}>
                → {fix}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PainPoints() {
  return (
    <section className="py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          이런 순간, 낯익지 않으신가요
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
          거창한 문제가 아니라 매일 반복되는 작은 고민들입니다. 하지만 매일
          반복되기 때문에, 쌓이면 하루의 상당 부분을 갉아먹습니다. zeff는
          바로 그 지점을 대신 처리합니다.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <Column mode="office" points={OFFICE_POINTS} />
        <Column mode="student" points={STUDENT_POINTS} />
      </div>
    </section>
  );
}
