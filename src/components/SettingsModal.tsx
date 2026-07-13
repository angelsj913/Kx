"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, Wallet, Languages, Check } from "lucide-react";
import { useT, useAppLanguage, type AppLanguage, type AppDictKey } from "@/lib/i18n";
import { useSettings, type UserSettings } from "@/lib/useSettings";
import { QUICK_TOOL_IDS, QUICK_TOOLS, isQuickToolEnabled } from "@/lib/quickTools";

type Tab = "features" | "plan" | "language";

const PLANS: { id: UserSettings["plan"]; labelKey: any }[] = [
  { id: "free", labelKey: "sidebar.plan.free" },
  { id: "pro", labelKey: "sidebar.plan.pro" },
  { id: "professional", labelKey: "sidebar.plan.professional" },
];

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("features");

  // ESC 키 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 배경 오버레이 */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* 중앙 플로팅 모달 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl workspace-surface border border-[var(--workspace-border)] max-h-[90vh] overflow-hidden"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-[var(--workspace-border)] px-6 py-4">
            <p className="text-lg font-semibold text-[var(--workspace-text)]">
              {t("settings.title")}
            </p>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-surface)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex h-[32rem]">
            {/* 왼쪽 탭 메뉴 */}
            <nav className="flex w-40 shrink-0 flex-col gap-1 border-r border-[var(--workspace-border)] p-3">
              <p className="mb-2 px-2 text-sm font-semibold text-[var(--workspace-text)]">
                {t("settings.title")}
              </p>
              <TabButton active={tab === "features"} icon={Sparkles} label={t("settings.tab.features")} onClick={() => setTab("features")} />
              <TabButton active={tab === "plan"} icon={Wallet} label={t("settings.tab.plan")} onClick={() => setTab("plan")} />
              <TabButton active={tab === "language"} icon={Languages} label={t("settings.tab.language")} onClick={() => setTab("language")} />
            </nav>

            {/* 오른쪽 컨텐츠 */}
            <div className="relative min-w-0 flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === "features" && <FeaturesTab />}
                  {tab === "plan" && <PlanTab />}
                  {tab === "language" && <LanguageTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ==================== 하위 컴포넌트 ==================== */

function TabButton({ active, icon: Icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 ${
        active
          ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-surface)]"
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

function ToolGroup({ title, tools, isOn, onToggle, t }: any) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--workspace-text-secondary)]">{title}</p>
      <div className="space-y-1.5">
        {tools.map((tool: any) => {
          const Icon = tool.icon;
          const on = isOn(tool.id);
          return (
            <div
              key={tool.id}
              className="flex items-center justify-between rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2.5 text-sm text-[var(--workspace-text)]">
                <Icon className="h-4 w-4 text-[var(--workspace-text-secondary)]" />
                {t(`quicktool.${tool.id}.label` as AppDictKey)}
              </span>
              <button
                type="button"
                onClick={() => onToggle(tool.id)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
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
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--workspace-text-secondary)]">
        {t("settings.plan.current")}
      </p>
      <p className="mb-4 text-xs text-[var(--workspace-text-secondary)]">{t("settings.plan.note")}</p>
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
                  ? "border-blue-500/60 bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  : "border-[var(--workspace-border)] bg-[var(--workspace-surface)] text-[var(--workspace-text-secondary)] hover:border-[var(--workspace-accent)]"
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
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--workspace-text-secondary)]">
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
                ? "border-blue-500/60 bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                : "border-[var(--workspace-border)] bg-[var(--workspace-surface)] text-[var(--workspace-text-secondary)] hover:border-[var(--workspace-accent)]"
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
