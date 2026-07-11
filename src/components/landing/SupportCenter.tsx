"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  HelpCircle,
  Megaphone,
  Archive,
  Mail,
  ScrollText,
  ChevronDown,
  Download,
} from "lucide-react";
import { useLandingT, type LandingDictKey } from "@/lib/landingI18n";
import { WINDOWS_DOWNLOAD_URL, MAC_DOWNLOAD_URL, ALL_RELEASES_URL } from "@/lib/constants";

export type SupportTab = "faq" | "announcements" | "legacy" | "inquiry" | "legal";

const FAQ_KEYS: [LandingDictKey, LandingDictKey][] = [
  ["support.faq.q1", "support.faq.a1"],
  ["support.faq.q2", "support.faq.a2"],
  ["support.faq.q3", "support.faq.a3"],
  ["support.faq.q4", "support.faq.a4"],
  ["support.faq.q5", "support.faq.a5"],
  ["support.faq.q6", "support.faq.a6"],
  ["support.faq.q7", "support.faq.a7"],
  ["support.faq.q8", "support.faq.a8"],
];

const ANNOUNCE_KEYS: [LandingDictKey, LandingDictKey, LandingDictKey][] = [
  ["support.announce.date1", "support.announce.title1", "support.announce.desc1"],
  ["support.announce.date2", "support.announce.title2", "support.announce.desc2"],
  ["support.announce.date3", "support.announce.title3", "support.announce.desc3"],
  ["support.announce.date4", "support.announce.title4", "support.announce.desc4"],
  ["support.announce.date5", "support.announce.title5", "support.announce.desc5"],
];

const TERMS_KEYS: [LandingDictKey, LandingDictKey][] = [
  ["support.legal.terms.s1.title", "support.legal.terms.s1.body"],
  ["support.legal.terms.s2.title", "support.legal.terms.s2.body"],
  ["support.legal.terms.s3.title", "support.legal.terms.s3.body"],
  ["support.legal.terms.s4.title", "support.legal.terms.s4.body"],
  ["support.legal.terms.s5.title", "support.legal.terms.s5.body"],
];

const PRIVACY_KEYS: [LandingDictKey, LandingDictKey][] = [
  ["support.legal.privacy.s1.title", "support.legal.privacy.s1.body"],
  ["support.legal.privacy.s2.title", "support.legal.privacy.s2.body"],
  ["support.legal.privacy.s3.title", "support.legal.privacy.s3.body"],
  ["support.legal.privacy.s4.title", "support.legal.privacy.s4.body"],
  ["support.legal.privacy.s5.title", "support.legal.privacy.s5.body"],
];

export default function SupportCenter({
  open,
  onClose,
  initialTab = "faq",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: SupportTab;
}) {
  const t = useLandingT();
  const [tab, setTab] = useState<SupportTab>(initialTab);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[36rem] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
          >
            <nav className="flex w-48 shrink-0 flex-col gap-1 border-r border-slate-100 bg-slate-50/60 p-3">
              <p className="mb-2 px-2 text-sm font-semibold text-slate-900">{t("support.title")}</p>
              <TabButton active={tab === "faq"} icon={HelpCircle} label={t("support.tab.faq")} onClick={() => setTab("faq")} />
              <TabButton
                active={tab === "announcements"}
                icon={Megaphone}
                label={t("support.tab.announcements")}
                onClick={() => setTab("announcements")}
              />
              <TabButton active={tab === "legacy"} icon={Archive} label={t("support.tab.legacy")} onClick={() => setTab("legacy")} />
              <TabButton active={tab === "inquiry"} icon={Mail} label={t("support.tab.inquiry")} onClick={() => setTab("inquiry")} />
              <TabButton active={tab === "legal"} icon={ScrollText} label={t("support.tab.legal")} onClick={() => setTab("legal")} />
            </nav>

            <div className="relative min-w-0 flex-1 overflow-y-auto p-6">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  {tab === "faq" && <FaqTab />}
                  {tab === "announcements" && <AnnouncementsTab />}
                  {tab === "legacy" && <LegacyTab />}
                  {tab === "inquiry" && <InquiryTab />}
                  {tab === "legal" && <LegalTab />}
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
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-300 ${
        active ? "bg-blue-600/10 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

function FaqTab() {
  const t = useLandingT();
  return (
    <div className="space-y-3">
      {FAQ_KEYS.map(([qKey, aKey]) => (
        <details
          key={qKey}
          className="group rounded-xl border border-slate-200 bg-white p-4 open:border-blue-400/60"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
            {t(qKey)}
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{t(aKey)}</p>
        </details>
      ))}
    </div>
  );
}

function AnnouncementsTab() {
  const t = useLandingT();
  return (
    <ul className="space-y-4 border-l border-slate-200 pl-5">
      {ANNOUNCE_KEYS.map(([dateKey, titleKey, descKey]) => (
        <li key={titleKey} className="relative">
          <span className="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
          <p className="text-xs font-medium text-blue-600">{t(dateKey)}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{t(titleKey)}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(descKey)}</p>
        </li>
      ))}
    </ul>
  );
}

function LegacyTab() {
  const t = useLandingT();
  return (
    <div>
      <p className="text-sm text-slate-600">{t("support.legacy.desc")}</p>
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("support.legacy.current")}</p>
        <a
          href={WINDOWS_DOWNLOAD_URL}
          className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors duration-300 hover:border-blue-400/60 hover:text-blue-700"
        >
          Windows <Download className="h-4 w-4" />
        </a>
        <a
          href={MAC_DOWNLOAD_URL}
          className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors duration-300 hover:border-blue-400/60 hover:text-blue-700"
        >
          macOS <Download className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("support.legacy.archive")}</p>
        <a
          href={ALL_RELEASES_URL}
          className="block rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 transition-colors duration-300 hover:border-blue-400/60 hover:text-blue-700"
        >
          {ALL_RELEASES_URL}
        </a>
        <p className="text-xs text-slate-400">{t("support.legacy.archiveNote")}</p>
      </div>
    </div>
  );
}

function InquiryTab() {
  const t = useLandingT();
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">{t("support.inquiry.success")}</p>;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-500">{t("support.inquiry.typeLabel")}</span>
        <select className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70">
          <option>{t("support.inquiry.type.billing")}</option>
          <option>{t("support.inquiry.type.bug")}</option>
          <option>{t("support.inquiry.type.feature")}</option>
          <option>{t("support.inquiry.type.etc")}</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-500">{t("support.inquiry.subjectLabel")}</span>
        <input
          type="text"
          required
          placeholder={t("support.inquiry.subjectPlaceholder")}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-500">{t("support.inquiry.bodyLabel")}</span>
        <textarea
          required
          rows={4}
          placeholder={t("support.inquiry.bodyPlaceholder")}
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-500">{t("support.inquiry.emailLabel")}</span>
        <input
          type="email"
          required
          placeholder={t("support.inquiry.emailPlaceholder")}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-blue-500"
      >
        {t("support.inquiry.submit")}
      </button>
    </form>
  );
}

function LegalTab() {
  const t = useLandingT();
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-bold text-slate-900">{t("support.legal.termsTitle")}</h3>
        <div className="mt-3 space-y-4">
          {TERMS_KEYS.map(([titleKey, bodyKey]) => (
            <div key={titleKey}>
              <p className="text-sm font-semibold text-slate-800">{t(titleKey)}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h3 id="privacy" className="scroll-mt-6 text-base font-bold text-slate-900">
          {t("support.legal.privacyTitle")}
        </h3>
        <div className="mt-3 space-y-4">
          {PRIVACY_KEYS.map(([titleKey, bodyKey]) => (
            <div key={titleKey}>
              <p className="text-sm font-semibold text-slate-800">{t(titleKey)}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
