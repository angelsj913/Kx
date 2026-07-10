"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  UserRound,
  SlidersHorizontal,
  ShieldCheck,
  CreditCard,
  FileCode,
  Keyboard,
  Languages,
  KeyRound,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import { QUICK_TOOLS } from "@/lib/quickTools";

type Tab = "general" | "account" | "privacy" | "billing" | "features" | "shortcuts" | "language";

const TABS: { id: Tab; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", labelKey: "settings.tab.general", icon: SlidersHorizontal },
  { id: "account", labelKey: "settings.tab.account", icon: UserRound },
  { id: "privacy", labelKey: "settings.tab.privacy", icon: ShieldCheck },
  { id: "billing", labelKey: "settings.tab.billing", icon: CreditCard },
  { id: "features", labelKey: "settings.tab.features", icon: FileCode },
  { id: "shortcuts", labelKey: "settings.tab.shortcuts", icon: Keyboard },
  { id: "language", labelKey: "settings.tab.language", icon: Languages },
];

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("general");
  const t = useT();
  const settings = useSettings();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex h-[32rem] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="w-40 shrink-0 border-r border-slate-800/60 bg-slate-950/40 p-2 sm:w-48">
              {TABS.map((tabItem) => (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setTab(tabItem.id)}
                  className={`relative mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ${
                    tab === tabItem.id ? "text-white" : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  {tab === tabItem.id && (
                    <motion.span
                      layoutId="settings-tab-highlight"
                      className="absolute inset-0 rounded-lg bg-slate-800"
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  )}
                  <tabItem.icon className="relative h-4 w-4 shrink-0" />
                  <span className="relative">{t(tabItem.labelKey)}</span>
                </button>
              ))}
            </nav>

            <div className="relative flex min-w-0 flex-1 flex-col">
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    {tab === "general" && <GeneralTab />}
                    {tab === "account" && <AccountTab />}
                    {tab === "privacy" && <PrivacyTab />}
                    {tab === "billing" && <BillingTab />}
                    {tab === "features" && <FeaturesTab settings={settings} />}
                    {tab === "shortcuts" && <ShortcutsTab />}
                    {tab === "language" && <LanguageTab settings={settings} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  label,
  desc,
  action,
}: {
  label: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-3 transition-colors duration-150">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function MutedButton({
  children,
  danger = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
        disabled
          ? "border-slate-800 text-slate-600"
          : danger
            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
            : "border-slate-700/60 text-slate-300 hover:bg-slate-800/60"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-violet-500" : "bg-slate-700"
      }`}
    >
      <motion.span
        layout
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: checked ? "1.375rem" : "0.125rem" }}
      />
    </button>
  );
}

function GeneralTab() {
  const t = useT();
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">{t("settings.tab.general")}</h2>
      <Section title={t("settings.general.profileSection")}>
        <Row
          label={t("settings.general.profileRow")}
          desc={t("settings.general.profileDesc")}
          action={<MutedButton>{t("common.edit")}</MutedButton>}
        />
      </Section>
      <Section title={t("settings.general.prefSection")}>
        <Row
          label={t("settings.general.theme")}
          desc={t("settings.general.themeDesc")}
          action={<MutedButton disabled>{t("profile.comingSoon")}</MutedButton>}
        />
      </Section>
    </>
  );
}

function AccountTab() {
  const { data: session } = useSession();
  const t = useT();
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">{t("settings.tab.account")}</h2>
      <Section title={t("settings.account.infoSection")}>
        <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
            <UserRound className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{session?.user?.name ?? t("common.user")}</p>
            <p className="truncate text-xs text-slate-500">{session?.user?.email ?? ""}</p>
          </div>
        </div>
        <Row
          label={t("settings.account.passwordRow")}
          desc={t("settings.account.passwordDesc")}
          action={
            <MutedButton disabled>
              <KeyRound className="mr-1 inline h-3 w-3" />
              {t("profile.comingSoon")}
            </MutedButton>
          }
        />
        <Row
          label={t("settings.account.allDevicesRow")}
          desc={t("settings.account.allDevicesDesc")}
          action={<MutedButton onClick={() => signOut({ callbackUrl: "/" })}>{t("profile.logout")}</MutedButton>}
        />
      </Section>
      <Section title={t("common.dangerZone")}>
        <Row
          label={t("settings.account.deleteRow")}
          desc={t("settings.account.deleteDesc")}
          action={<MutedButton danger>{t("settings.account.deleteButton")}</MutedButton>}
        />
      </Section>
    </>
  );
}

function PrivacyTab() {
  const t = useT();
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">{t("settings.tab.privacy")}</h2>
      <Section title={t("settings.privacy.termsSection")}>
        <Row label={t("settings.privacy.policyRow")} action={<MutedButton>{t("common.view")}</MutedButton>} />
      </Section>
      <Section title={t("settings.privacy.dataSection")}>
        <Row
          label={t("settings.privacy.dataRow")}
          desc={t("settings.privacy.dataDesc")}
          action={<MutedButton>{t("common.manage")}</MutedButton>}
        />
      </Section>
    </>
  );
}

function BillingTab() {
  const t = useT();
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">{t("settings.tab.billing")}</h2>
      <Section title={t("settings.billing.infoSection")}>
        <Row
          label={t("settings.billing.methodRow")}
          desc={t("settings.billing.methodDesc")}
          action={<MutedButton>{t("settings.billing.register")}</MutedButton>}
        />
        <Row
          label={t("settings.billing.invoiceRow")}
          desc={t("settings.billing.invoiceDesc")}
          action={<MutedButton>{t("common.view")}</MutedButton>}
        />
        <Row label={t("settings.billing.nextRow")} desc={t("settings.billing.nextDesc")} />
      </Section>
      <Section title={t("common.dangerZone")}>
        <Row label={t("settings.billing.cancelRow")} action={<MutedButton danger>{t("settings.billing.cancel")}</MutedButton>} />
      </Section>
    </>
  );
}

function FeaturesTab({ settings }: { settings: ReturnType<typeof useSettings> }) {
  const t = useT();
  const office = QUICK_TOOLS.filter((tool) => tool.group === "office");
  const student = QUICK_TOOLS.filter((tool) => tool.group === "student");
  const isEnabled = (id: string) => settings.enabledQuickTools?.[id] !== false;

  function toggle(id: string) {
    const next: Record<string, boolean> = {};
    for (const tool of QUICK_TOOLS) next[tool.id] = isEnabled(tool.id);
    next[id] = !next[id];
    settings.updateQuickTools(next);
  }

  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">{t("settings.features.title")}</h2>
      <p className="-mt-2 mb-5 text-xs text-slate-500">{t("settings.features.desc")}</p>
      <Section title={t("chat.groupOffice")}>
        {office.map((tool) => (
          <Row
            key={tool.id}
            label={t(tool.labelKey)}
            action={<Toggle checked={isEnabled(tool.id)} onChange={() => toggle(tool.id)} />}
          />
        ))}
      </Section>
      <Section title={t("chat.groupStudent")}>
        {student.map((tool) => (
          <Row
            key={tool.id}
            label={t(tool.labelKey)}
            action={<Toggle checked={isEnabled(tool.id)} onChange={() => toggle(tool.id)} />}
          />
        ))}
      </Section>
    </>
  );
}

function ShortcutsTab() {
  const t = useT();
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">{t("settings.tab.shortcuts")}</h2>
      <Section title={t("settings.shortcuts.section")}>
        <Row label={t("settings.shortcuts.newChat")} action={<kbd className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">⌘ N</kbd>} />
        <Row label={t("settings.shortcuts.send")} action={<kbd className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">Enter</kbd>} />
        <Row label={t("settings.shortcuts.openSettings")} action={<kbd className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">⌘ ,</kbd>} />
      </Section>
    </>
  );
}

function LanguageTab({ settings }: { settings: ReturnType<typeof useSettings> }) {
  const t = useT();
  const [pending, setPending] = useState(settings.language);
  const [applied, setApplied] = useState(false);
  const dirty = pending !== settings.language;

  function apply() {
    settings.updateLanguage(pending);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  }

  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">{t("settings.tab.language")}</h2>
      <Section title={t("settings.language.title")}>
        <Row
          label={t("settings.language.title")}
          desc={t("settings.language.desc", { lang: t(settings.language === "en" ? "lang.en" : "lang.ko") })}
          action={
            <div className="flex items-center gap-2">
              <select
                value={pending}
                onChange={(e) => setPending(e.target.value === "en" ? "en" : "ko")}
                className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-200 outline-none transition-colors duration-150 focus:border-violet-500/60"
              >
                <option value="ko">{t("lang.ko")}</option>
                <option value="en">{t("lang.en")}</option>
              </select>
              <button
                type="button"
                onClick={apply}
                disabled={!dirty}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all duration-150 ${
                  dirty ? "bg-blue-600 hover:bg-blue-500" : "cursor-not-allowed bg-blue-600/30"
                }`}
              >
                {t("settings.language.apply")}
              </button>
            </div>
          }
        />
        <AnimatePresence>
          {applied && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="px-1 text-xs text-emerald-400"
            >
              {t("settings.language.applied")}
            </motion.p>
          )}
        </AnimatePresence>
      </Section>
    </>
  );
}
