"use client";

import { useState } from "react";
import Image from "next/image";
import { useLandingT } from "@/lib/landingI18n";
import SupportCenter from "./SupportCenter";

const CONTACT_EMAIL = "kxeung9@gmail.com";
const CEO_NAME = "KWON SEUNGJUN";

export default function Footer() {
  const t = useLandingT();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <footer className="relative overflow-hidden bg-slate-100 py-14 dark:bg-slate-950">
      <Image
        src="/logo-zeff.png"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => setPrivacyOpen(true)}
          className="font-medium text-slate-600 transition-colors duration-300 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          {t("footer.privacy")}
        </button>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("footer.brand")}</p>
        <p>
          {t("footer.contact")} {CONTACT_EMAIL} · {t("footer.ceo")} {CEO_NAME}
        </p>
      </div>

      <SupportCenter open={privacyOpen} onClose={() => setPrivacyOpen(false)} initialTab="legal" />
    </footer>
  );
}
