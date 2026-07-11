"use client";

import Image from "next/image";
import Link from "next/link";
import { useLandingT } from "@/lib/landingI18n";
import Logo from "@/components/ui/Logo";

const CONTACT_EMAIL = "zeff@zeffai.com";
const CEO_NAME = "KWON SEUNGJUN";

export default function Footer() {
  const t = useLandingT();

  return (
    <footer className="relative overflow-hidden bg-slate-50 py-14 dark:bg-slate-950">
      <Image
        src="/logo-zeff.png"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.09] dark:invert"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <Link
          href="/support/legal#privacy"
          className="font-medium text-slate-600 transition-colors duration-300 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          {t("footer.privacy")}
        </Link>
        <Logo size="md" />
        <p>
          {t("footer.contact")} {CONTACT_EMAIL} · {t("footer.ceo")} {CEO_NAME}
        </p>
      </div>
    </footer>
  );
}
