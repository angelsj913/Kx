"use client";

import Link from "next/link";
import { useLandingLanguage, useLandingT } from "@/lib/landingI18n";

const CONTACT_EMAIL = "zeff@zeffai.com";

export default function Footer() {
  const t = useLandingT();
  const { language } = useLandingLanguage();
  const ceoName = language === "ko" ? "권승준" : "Kwon Seungjun";

  return (
    <footer className="border-t border-slate-200/60 py-10 dark:border-slate-800/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between dark:text-slate-400">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/support" className="font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
            {t("nav.support")}
          </Link>
          <Link href="/support/legal#terms" className="font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
            {t("footer.terms")}
          </Link>
          <Link href="/support/legal#privacy" className="font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
            {t("footer.privacy")}
          </Link>
          <Link href="/support/inquiry" className="font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
            {t("footer.inquiry")}
          </Link>
        </nav>
        <p className="text-center md:text-right">
          ZEFF AI · {t("footer.contact")} {CONTACT_EMAIL} · {t("footer.ceo")} {ceoName}
        </p>
      </div>
    </footer>
  );
}
