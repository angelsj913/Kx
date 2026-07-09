"use client";

import { GraduationCap, Briefcase } from "lucide-react";
import type { AppMode } from "@/lib/tools";

const OPTIONS: { id: AppMode; label: string; icon: typeof Briefcase }[] = [
  { id: "student", label: "학생", icon: GraduationCap },
  { id: "office", label: "직장인", icon: Briefcase },
];

export default function ModeSwitch({
  mode,
  onChange,
}: {
  mode: AppMode;
  onChange: (m: AppMode) => void;
}) {
  const activeIndex = OPTIONS.findIndex((o) => o.id === mode);

  return (
    <div className="relative flex rounded-xl border border-slate-700/60 bg-slate-900/60 p-1 backdrop-blur-md">
      {/* sliding highlight */}
      <span
        aria-hidden
        className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/40 transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-300 ${
              active ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
