"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import EmailOtpVerifier from "@/components/auth/EmailOtpVerifier";
import Logo from "@/components/ui/Logo";

export default function FindIdPage() {
  const t = useLandingT();
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [foundUsername, setFoundUsername] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3.5">
          <BackButton fallbackHref="/login" />
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-md px-6 py-10">
        <h1 className="text-2xl font-bold">{t("auth.findId.title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("auth.findId.subtitle")}</p>

        <div className="mt-8">
          {verifiedEmail ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 text-center dark:border-blue-500/30 dark:bg-blue-500/10">
              <CheckCircle2 className="mx-auto h-9 w-9 text-blue-600 dark:text-blue-400" />
              {foundUsername ? (
                <>
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                    {t("auth.findId.idLabel")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">{foundUsername}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{verifiedEmail}</p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{t("auth.findId.noId")}</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-50">{verifiedEmail}</p>
                </>
              )}
              <Link
                href="/login"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                {t("auth.goLogin")}
              </Link>
            </div>
          ) : (
            <EmailOtpVerifier
              purpose="find-id"
              onVerified={(email, extra) => {
                setVerifiedEmail(email);
                setFoundUsername(extra?.username ?? null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
