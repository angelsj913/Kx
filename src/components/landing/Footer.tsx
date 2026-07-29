"use client";

import Link from "next/link";
import { useLandingLanguage, useLandingT } from "@/lib/landingI18n";

const CONTACT_EMAIL = "zeff@zeffai.com";

export default function Footer() {
  const t = useLandingT();
  const { language } = useLandingLanguage();
  const ceoName = language === "ko" ? "권승준" : "Kwon Seungjun";

  return (
    <footer className="bg-[#0a1f4e] text-slate-300 dark:bg-[#060f2a]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 sm:py-24 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md text-left">
          <p className="text-sm font-semibold text-white">{t("footer.brand")}</p>
          <dl className="mt-4 space-y-2 text-xs leading-relaxed">
            <div>
              <dt className="inline font-medium text-slate-400">{t("footer.ceo")}: </dt>
              <dd className="inline">{ceoName}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-400">{t("footer.bizName")}: </dt>
              <dd className="inline">{t("footer.bizNameValue")}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-400">{t("footer.bizNo")}: </dt>
              <dd className="inline">{t("footer.bizNoValue")}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-400">{t("footer.bizAddress")}: </dt>
              <dd className="inline">{t("footer.bizAddressValue")}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-400">{t("footer.tel")}: </dt>
              <dd className="inline">{t("footer.telValue")}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-400">{t("footer.contact")}: </dt>
              <dd className="inline">{CONTACT_EMAIL}</dd>
            </div>
          </dl>
        </div>

        <div className="text-left md:text-right">
          <nav className="landing-label flex flex-wrap items-start gap-x-4 gap-y-2 text-[10px] md:justify-end">
            <Link href="/support" className="font-medium text-slate-200 hover:text-white">
              {t("nav.support")}
            </Link>
            <Link href="/support/legal#terms" className="font-medium text-slate-200 hover:text-white">
              {t("footer.terms")}
            </Link>
            <Link href="/support/legal#privacy" className="font-medium text-slate-200 hover:text-white">
              {t("footer.privacy")}
            </Link>
            <Link href="/support/legal#refund" className="font-medium text-slate-200 hover:text-white">
              {t("footer.refund")}
            </Link>
            <Link href="/support/inquiry" className="font-medium text-slate-200 hover:text-white">
              {t("footer.inquiry")}
            </Link>
          </nav>
          <p className="mt-4 text-xs text-slate-400">
            © {new Date().getFullYear()} ZEFF AI
          </p>
        </div>
      </div>
    </footer>
  );
}
