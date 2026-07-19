"use client";

import Image from "next/image";
import Link from "next/link";
import { useLandingLanguage, useLandingT } from "@/lib/landingI18n";
import Logo from "@/components/ui/Logo";

const CONTACT_EMAIL = "zeff@zeffai.com";

export default function Footer() {
  const t = useLandingT();
  const { language } = useLandingLanguage();
  const ceoName = language === "ko" ? "권승준" : "Kwon Seungjun";

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-50 py-14 dark:from-slate-950 dark:to-slate-950">
      {/* Team 섹션과 상단 이음새 제거 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-50/0 to-transparent dark:from-slate-950 dark:to-transparent"
      />
      <Image
        src="/logo-zeff.png"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] dark:hidden"
      />
      <Image
        src="/logo-zeff-dark.png"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 opacity-[0.09] dark:block"
      />

      {/* 좌: 내비 링크 / 우: 브랜드·회사·대표 정보(오른쪽 벽으로 정렬).
          모바일에서는 세로 스택으로 자연스럽게 폴백한다. */}
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 text-xs text-slate-500 md:flex-row md:items-end md:justify-between md:gap-6 dark:text-slate-400">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
          <Link
            href="/support"
            className="font-medium text-slate-600 transition-colors duration-300 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            {t("nav.support")}
          </Link>
          <Link
            href="/support/legal#terms"
            className="font-medium text-slate-600 transition-colors duration-300 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            {t("footer.terms")}
          </Link>
          <Link
            href="/support/legal#privacy"
            className="font-medium text-slate-600 transition-colors duration-300 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            {t("footer.privacy")}
          </Link>
          <Link
            href="/support/inquiry"
            className="font-medium text-slate-600 transition-colors duration-300 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            {t("footer.inquiry")}
          </Link>
        </nav>
        {/* 브랜드 워드마크 + 회사/대표 정보 — 오른쪽 벽에 붙는 블록 */}
        <div className="flex flex-col items-center gap-2 md:items-end md:text-right">
          <Logo size="md" />
          <p>
            {t("footer.contact")} {CONTACT_EMAIL} · {t("footer.ceo")} {ceoName}
          </p>
        </div>
      </div>
    </footer>
  );
}
