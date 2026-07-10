"use client";

import Image from "next/image";
import { useLandingT } from "@/lib/landingI18n";

const CONTACT_EMAIL = "kxeung9@gmail.com";
const CEO_NAME = "KWON SEUNGJUN";

export default function Footer() {
  const t = useLandingT();

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 py-14">
      <Image
        src="/logo-zeff.jpg"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center text-xs text-slate-500">
        <a href="#" className="font-medium text-slate-600 transition-colors hover:text-blue-600">
          {t("footer.privacy")}
        </a>
        <p className="text-sm font-bold text-slate-900">{t("footer.brand")}</p>
        <p>
          {t("footer.contact")} {CONTACT_EMAIL} · {t("footer.ceo")} {CEO_NAME}
        </p>
      </div>
    </footer>
  );
}
