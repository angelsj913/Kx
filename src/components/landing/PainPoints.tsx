import { Mail, ClipboardList, BarChart3, Video, FileText, BookMarked } from "lucide-react";
import { LANDING_MODE_STYLE } from "@/lib/landingTheme";

const OFFICE_POINTS = [
  {
    icon: Mail,
    pain: "보고서 하나 쓰는데 문장 다듬느라 30분이 훌쩍 갑니다.",
    fix: "요지만 적으면 바로 쓸 수 있는 문서 두 버전으로 완성",
  },
  {
    icon: ClipboardList,
    pain: "회의는 끝났는데 누가 뭘 언제까지 하기로 했는지 기억이 안 납니다.",
    fix: "담당자·기한이 정리된 회의록으로 자동 변환",
  },
  {
    icon: BarChart3,
    pain: "주간 보고 쓸 때마다 지난주에 뭘 했는지부터 다시 뒤져봅니다.",
    fix: "진행률 슬라이더만 조정하면 끝나는 보고 양식",
  },
];

const STUDENT_POINTS = [
  {
    icon: Video,
    pain: "놓친 강의를 처음부터 다시 돌려보느라 시간이 다 갑니다.",
    fix: "영상·녹음을 복습 포인트까지 짚어주는 노트로 정리",
  },
  {
    icon: FileText,
    pain: "발표문은 첫 문장부터 막혀서 자꾸 미루게 됩니다.",
    fix: "주제만 넣으면 서론부터 결론까지 대본 완성",
  },
  {
    icon: BookMarked,
    pain: "레포트 마감은 다가오는데 자료 정리부터 막막합니다.",
    fix: "섹션별 초안과 참고자료 메모까지 한 번에 제안",
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
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          매일 반복되는 작은 고민들, AI 툴킷이 대신 처리합니다.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <Column mode="office" points={OFFICE_POINTS} />
        <Column mode="student" points={STUDENT_POINTS} />
      </div>
    </section>
  );
}
