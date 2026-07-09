import { Briefcase, GraduationCap, Check } from "lucide-react";
import { LANDING_MODE_STYLE } from "@/lib/landingTheme";

const PANELS = [
  { mode: "office" as const, icon: Briefcase },
  { mode: "student" as const, icon: GraduationCap },
];

export default function ModeShowcase() {
  return (
    <section className="py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          하나의 앱, 완전히 다른 두 가지 경험
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
          직장인에게 필요한 도구와 학생에게 필요한 도구는 애초에 다릅니다. 그래서
          기능을 욱여넣는 대신, 모드를 나눴습니다. 로그인 후 상단에서 모드만
          바꾸면 화면 구성과 도구 목록, 색감까지 그 자리에서 전환됩니다.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {PANELS.map(({ mode, icon: Icon }) => {
          const s = LANDING_MODE_STYLE[mode];
          return (
            <div
              key={mode}
              className={`group relative overflow-hidden rounded-3xl border ${s.border} ${s.panelBg} p-8 shadow-xl shadow-black/30 backdrop-blur-md transition-colors duration-300 ${s.borderHover}`}
            >
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full ${s.glow} blur-[90px] transition-opacity duration-300 group-hover:opacity-150`}
              />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.iconBg} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-50">{s.name}</h3>
                    <p className={`text-xs font-semibold ${s.accentText}`}>{s.tagline}</p>
                  </div>
                </div>

                <p className="mt-6 text-lg font-semibold leading-snug text-slate-100">
                  {s.headline}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                  {s.subline}
                </p>

                <ul className="mt-5 space-y-3">
                  {s.valueProps.map((v) => (
                    <li key={v} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${s.accentText}`} />
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
