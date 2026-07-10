"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, Wallet, Languages, Check } from "lucide-react";
import { useT, useAppLanguage, type AppLanguage, type AppDictKey } from "@/lib/i18n";
import { useSettings, type UserSettings } from "@/lib/useSettings";
import { QUICK_TOOL_IDS, QUICK_TOOLS, isQuickToolEnabled } from "@/lib/quickTools";

type Tab = "features" | "plan" | "language";

const PLANS: { id: UserSettings["plan"]; labelKey: "sidebar.plan.free" | "sidebar.plan.pro" | "sidebar.plan.professional" }[] = [
  { id: "free", labelKey: "sidebar.plan.free" },
  { id: "pro", labelKey: "sidebar.plan.pro" },
  { id: "professional", labelKey: "sidebar.plan.professional" },
];

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("features");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[32rem] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md"
          >
            <nav className="flex w-40 shrink-0 flex-col gap-1 border-r border-slate-800/60 p-3">
              <p className="mb-2 px-2 text-sm font-semibold text-slate-100">{t("settings.title")}</p>
              <TabButton active={tab === "features"} icon={Sparkles} label={t("settings.tab.features")} onClick={() => setTab("features")} />
              <TabButton active={tab === "plan"} icon={Wallet} label={t("settings.tab.plan")} onClick={() => setTab("plan")} />
              <TabButton active={tab === "language"} icon={Languages} label={t("settings.tab.language")} onClick={() => setTab("language")} />
            </nav>

            <div className="relative min-w-0 flex-1 overflow-y-auto p-5">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              >
                <X className="h-4 w-4" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {tab === "features" && <FeaturesTab />}
                  {tab === "plan" && <PlanTab />}
                  {tab === "language" && <LanguageTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 ${
        active ? "bg-violet-600/20 text-violet-200" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

function FeaturesTab() {
  const t = useT();
  const { settings, updateQuickTools } = useSettings();
  const enabled = settings?.enabledQuickTools ?? [];
  const isOn = (id: string) => isQuickToolEnabled(enabled, id);

  function toggle(id: string) {
    const current = enabled.length === 0 ? QUICK_TOOL_IDS : enabled;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    updateQuickTools(next);
  }

  const office = QUICK_TOOLS.filter((tool) => tool.appMode === "office");
  const student = QUICK_TOOLS.filter((tool) => tool.appMode === "student");

  return (
    <div className="space-y-6">
      <ToolGroup title={t("settings.features.office")} tools={office} isOn={isOn} onToggle={toggle} t={t} />
      <ToolGroup title={t("settings.features.student")} tools={student} isOn={isOn} onToggle={toggle} t={t} />
    </div>
  );
}

function ToolGroup({
  title,
  tools,
  isOn,
  onToggle,
  t,
}: {
  title: string;
  tools: typeof QUICK_TOOLS;
  isOn: (id: string) => boolean;
  onToggle: (id: string) => void;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="space-y-1.5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const on = isOn(tool.id);
          return (
            <div
              key={tool.id}
              className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-800/30 px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2.5 text-sm text-slate-200">
                <Icon className="h-4 w-4 text-slate-400" />
                {t(`quicktool.${tool.id}.label` as AppDictKey)}
              </span>
              <button
                type="button"
                onClick={() => onToggle(tool.id)}
                aria-pressed={on}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-violet-600" : "bg-slate-700"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-4" : "translate-x-0"}`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanTab() {
  const t = useT();
  const { settings, updatePlan } = useSettings();
  const current = settings?.plan ?? "free";

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("settings.plan.current")}
      </p>
      <p className="mb-4 text-xs text-slate-500">{t("settings.plan.note")}</p>
      <div className="space-y-2">
        {PLANS.map((p) => {
          const active = p.id === current;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => updatePlan(p.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors duration-200 ${
                active
                  ? "border-violet-500/60 bg-violet-600/15 text-violet-200"
                  : "border-slate-800/60 bg-slate-800/30 text-slate-300 hover:border-slate-700"
              }`}
            >
              {t(p.labelKey)}
              {active && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LanguageTab() {
  const t = useT();
  const committed = useAppLanguage();
  const { updateLanguage } = useSettings();
  const [draft, setDraft] = useState<AppLanguage>(committed);
  const [applying, setApplying] = useState(false);

  const dirty = draft !== committed;

  async function apply() {
    setApplying(true);
    try {
      await updateLanguage(draft);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("settings.language.label")}
      </p>
      <div className="mb-4 flex gap-2">
        {(["ko", "en"] as AppLanguage[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setDraft(lang)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              draft === lang
                ? "border-violet-500/60 bg-violet-600/15 text-violet-200"
                : "border-slate-800/60 bg-slate-800/30 text-slate-300 hover:border-slate-700"
            }`}
          >
            {lang === "ko" ? "한국어" : "English"}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={apply}
        disabled={!dirty || applying}
        className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("settings.language.apply")}
      </button>
    </div>
  );
}
