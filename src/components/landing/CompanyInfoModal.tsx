"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Building2, TrendingUp, FlaskConical, Check } from "lucide-react";
import { useLandingT, type LandingDictKey } from "@/lib/landingI18n";

export type CompanyTab = "about" | "vision" | "prototype";

const PROTOTYPE_ITEMS: LandingDictKey[] = [
  "company.prototype.item1",
  "company.prototype.item2",
  "company.prototype.item3",
  "company.prototype.item4",
];

export default function CompanyInfoModal({
  open,
  onClose,
  initialTab = "about",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: CompanyTab;
}) {
  const t = useLandingT();
  const [tab, setTab] = useState<CompanyTab>(initialTab);

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
            className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-1 border-b border-slate-100 px-6 pt-6">
              <MiniTab active={tab === "about"} icon={Building2} label={t("nav.about")} onClick={() => setTab("about")} />
              <MiniTab active={tab === "vision"} icon={TrendingUp} label={t("nav.potential")} onClick={() => setTab("vision")} />
              <MiniTab active={tab === "prototype"} icon={FlaskConical} label={t("nav.prototype")} onClick={() => setTab("prototype")} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  {tab === "about" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900">{t("company.about.title")}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{t("company.about.body1")}</p>
                      <p className="text-sm leading-relaxed text-slate-600">{t("company.about.body2")}</p>
                      <p className="text-sm leading-relaxed text-slate-600">{t("company.about.body3")}</p>
                    </div>
                  )}
                  {tab === "vision" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900">{t("company.vision.title")}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{t("company.vision.body1")}</p>
                      <p className="text-sm leading-relaxed text-slate-600">{t("company.vision.body2")}</p>
                      <p className="text-sm leading-relaxed text-slate-600">{t("company.vision.body3")}</p>
                    </div>
                  )}
                  {tab === "prototype" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900">{t("company.prototype.title")}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{t("company.prototype.body1")}</p>
                      <ul className="space-y-2.5">
                        {PROTOTYPE_ITEMS.map((key) => (
                          <li key={key} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            {t(key)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MiniTab({
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
      className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 pb-3 text-sm font-medium transition-colors duration-300 ${
        active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
