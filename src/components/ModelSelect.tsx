"use client";

import { useEffect, useRef, useState } from "react";
import { Cpu, ChevronDown, Check } from "lucide-react";
import { MODELS, PROVIDER_LABEL, type Provider } from "@/lib/models";

export default function ModelSelect({
  model,
  onChange,
  disabled,
}: {
  model: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = MODELS.find((m) => m.id === model) ?? MODELS[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [open]);

  const providers = [...new Set(MODELS.map((m) => m.provider))] as Provider[];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-violet-500/50 hover:text-violet-300 disabled:opacity-50"
      >
        <Cpu className="h-3.5 w-3.5" />
        <span>{current.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md">
          {providers.map((prov) => (
            <div key={prov}>
              <p className="border-b border-slate-800/60 bg-slate-800/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {PROVIDER_LABEL[prov]}
              </p>
              {MODELS.filter((m) => m.provider === prov).map((m) => {
                const active = m.id === model;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors ${
                      active ? "bg-violet-600/20" : "hover:bg-slate-800/60"
                    }`}
                  >
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        active ? "text-violet-400" : "text-transparent"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-100">
                        {m.label}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {m.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
