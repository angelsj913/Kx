"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import OtpInput from "@/components/auth/OtpInput";
import PasswordStrengthHint from "@/components/auth/PasswordStrengthHint";
import Logo from "@/components/ui/Logo";
import { checkPasswordStrength } from "@/lib/password";
import { useOtpFlow, fmtOtpTimer } from "@/lib/useOtpFlow";

export default function FindPasswordPage() {
  const t = useLandingT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpFlow = useOtpFlow("find-password");
  const { otpSent, otp, setOtp, otpVerified, secondsLeft, expired, info } = otpFlow;
  const displayError = error || otpFlow.error;

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const strength = checkPasswordStrength(password, { email });
    if (!strength.ok) {
      setError(strength.reason ?? "비밀번호 조건을 확인해 주세요.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "재설정에 실패했습니다.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

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
        <h1 className="text-2xl font-bold">{t("auth.findPw.title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("auth.findPw.subtitle")}</p>

        <div className="mt-8">
          {done ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 text-center dark:border-blue-500/30 dark:bg-blue-500/10">
              <CheckCircle2 className="mx-auto h-9 w-9 text-blue-600 dark:text-blue-400" />
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{t("auth.findPw.done")}</p>
              <Link
                href="/login"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                {t("auth.goLogin")}
              </Link>
            </div>
          ) : !otpVerified ? (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t("auth.field.email")}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={() => otpFlow.sendOtp(email)}
                  disabled={otpFlow.loading}
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                  {t("auth.otp.send")}
                </button>
              ) : (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t("auth.otp.enter")}</span>
                    <span className={expired ? "font-semibold text-red-500" : "font-semibold text-blue-600 dark:text-blue-400"}>
                      {expired ? t("auth.otp.expired") : fmtOtpTimer(secondsLeft)}
                    </span>
                  </div>
                  <OtpInput value={otp} onChange={setOtp} disabled={expired} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => otpFlow.checkOtp(email)}
                      disabled={otpFlow.loading || otp.length !== 6 || expired}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                    >
                      {t("auth.otp.verify")}
                    </button>
                    <button
                      type="button"
                      onClick={() => otpFlow.sendOtp(email)}
                      disabled={otpFlow.loading}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400/60 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      {t("auth.otp.resend")}
                    </button>
                  </div>
                </div>
              )}

              {info && <p className="text-xs text-slate-500 dark:text-slate-400">{info}</p>}
              {displayError && (
                <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {displayError}
                </p>
              )}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onReset}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t("auth.findPw.newPassword")}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t("auth.field.passwordHint")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <PasswordStrengthHint password={password} context={{ email }} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t("auth.findPw.confirmPassword")}
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
              {displayError && (
                <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {displayError}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
              >
                {t("auth.findPw.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
