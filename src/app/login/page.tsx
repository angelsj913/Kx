"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useLandingT } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function LoginCard() {
  const t = useLandingT();
  const callbackUrl = "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (res?.error) {
        setError(t("login.error"));
        setLoading(false);
        return;
      }
      window.location.href = res?.url || callbackUrl;
    } catch {
      setError(t("login.error"));
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[140px]" />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4">
        <BackButton fallbackHref="/" forceFallback />
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
        <Image
          src="/logo-zeff.png"
          alt="ZEFF AI"
          width={48}
          height={48}
          priority
          className="mx-auto rounded-xl dark:invert"
        />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-50">{t("login.title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("login.subtitle")}</p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:border-blue-500/50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <GoogleIcon />
          {t("login.google")}
        </button>

        <button
          type="button"
          disabled
          title={t("login.apple")}
          className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500"
        >
          {t("login.apple")}
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400">{t("login.or")}</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <form className="mt-6 space-y-3 text-left" onSubmit={onCredentials}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t("login.email")}
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors duration-400 focus:border-blue-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t("login.password")}
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors duration-400 focus:border-blue-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-blue-500 disabled:opacity-60"
          >
            {t("login.submit")}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/find-id" className="hover:text-blue-600 dark:hover:text-blue-400">
            {t("login.findId")}
          </Link>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <Link href="/find-password" className="hover:text-blue-600 dark:hover:text-blue-400">
            {t("login.findPassword")}
          </Link>
        </div>

        <p className="mt-5 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {t("login.signupPrompt")}{" "}
          <Link
            href="/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("login.signup")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}
