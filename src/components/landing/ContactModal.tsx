"use client";

import { X, Mail } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

const SUPPORT_EMAIL = "kxeung9@gmail.com";

export default function ContactModal({ onClose }: { onClose: () => void }) {
  const t = useLandingT();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={t("contact.close")}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{t("contact.title")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("contact.desc")}</p>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
        >
          <Mail className="h-4 w-4" />
          {SUPPORT_EMAIL}
        </a>
      </div>
    </div>
  );
}
