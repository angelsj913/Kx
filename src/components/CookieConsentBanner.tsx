"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLandingT } from "@/lib/landingI18n";

const STORAGE_KEY = "zeff_cookie_consent";

export default function CookieConsentBanner() {
  const t = useLandingT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-8px_24px_-8px_rgba(15,23,42,0.15)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/95 sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
          {t("cookie.banner")}
          {" "}
          <Link
            href="/support/legal#privacy"
            className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            {t("footer.privacy")}
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[var(--landing-accent,#2563eb)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {t("cookie.accept")}
        </button>
      </div>
    </div>
  );
}
