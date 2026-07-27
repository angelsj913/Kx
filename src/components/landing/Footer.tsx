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
    // 위 섹션과 경계선을 두지 않는다 — 푸터는 자체 배경이 없어 .landing-shell 표면이
    // 그대로 이어지므로, border-t만 빼면 색 불일치 없이 자연스럽게 연결된다.
    <footer>
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-14 text-xs text-slate-500 md:flex-row md:items-center md:justify-between dark:text-slate-400">
        {/* 로고 워터마크 — 예전에는 고정 높이 밴드에 따로 놓여 본문과 멀리 떨어져 있었다.
            이 행에 절대 배치해 수직 중앙을 맞추면 대표자 이름과 같은 높이에 온다. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center"
        >
          <div className="relative h-[7rem] w-[min(80vw,26rem)] opacity-[0.07] dark:opacity-[0.09]">
            <Image src="/logo-zeff.png" alt="" fill className="object-contain dark:hidden" sizes="416px" />
            <Image src="/logo-zeff-dark.png" alt="" fill className="hidden object-contain dark:block" sizes="416px" />
          </div>
        </div>

        <div className="relative z-10 ml-auto flex flex-col items-center md:items-end md:text-right">
          <nav className="landing-label flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] md:justify-end">
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
          <p className="mt-3 text-center md:text-right">
            ZEFF AI · {t("footer.contact")} {CONTACT_EMAIL} · {t("footer.ceo")} {ceoName}
          </p>
        </div>
      </div>
    </footer>
  );
}
