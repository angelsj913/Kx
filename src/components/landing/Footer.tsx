"use client";

import Image from "next/image";
import Link from "next/link";
import { useLandingLanguage, useLandingT } from "@/lib/landingI18n";

const CONTACT_EMAIL = "zeff@zeffai.com";

export default function Footer() {
  const t = useLandingT();
  const { language } = useLandingLanguage();
  const ceoName = language === "ko" ? "권승준" : "Kwon Seungjun";

  return (
    <footer className="border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 text-xs text-slate-500 md:flex-row md:items-center md:justify-between dark:text-slate-400">
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

      <div
        aria-hidden
        className="pointer-events-none relative flex h-[clamp(8rem,18vw,14rem)] select-none items-end justify-center overflow-hidden pb-2"
      >
        <div className="relative h-[min(70%,12rem)] w-[min(92vw,36rem)] opacity-[0.07] dark:opacity-[0.09]">
          <Image src="/logo-zeff.png" alt="" fill className="object-contain object-bottom dark:hidden" sizes="576px" />
          <Image src="/logo-zeff-dark.png" alt="" fill className="hidden object-contain object-bottom dark:block" sizes="576px" />
        </div>
      </div>
    </footer>
  );
}
