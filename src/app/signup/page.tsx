"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useLandingT } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import OtpInput from "@/components/auth/OtpInput";
import PasswordStrengthHint from "@/components/auth/PasswordStrengthHint";
import Logo from "@/components/ui/Logo";
import { checkPasswordStrength } from "@/lib/password";

function fmtTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SignupPage() {
  const t = useLandingT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const expired = otpSent && secondsLeft <= 0 && !otpVerified;

  async function sendOtp() {
    setError("");
    setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    const strength = checkPasswordStrength(password, { email });
    if (!strength.ok) {
      setError(strength.reason ?? "비밀번호 조건을 확인해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", identifier: email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "발송에 실패했습니다.");
      setOtpSent(true);
      setOtp("");
      setOtpVerified(false);
      setSecondsLeft(180);
      if (data.devCode) setInfo(`(개발용) 인증번호: ${data.devCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function checkOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", identifier: email, purpose: "signup", code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "인증에 실패했습니다.");
      setOtpVerified(true);
      setSecondsLeft(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!otpVerified) {
      setError("이메일 인증을 먼저 완료해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "가입에 실패했습니다.");
      await signIn("credentials", { email, password, callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
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
        <h1 className="text-2xl font-bold">{t("auth.signup.title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("auth.signup.subtitle")}</p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("auth.field.email")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpVerified}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("auth.field.password")}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={otpVerified}
              required
              placeholder={t("auth.field.passwordHint")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {!otpVerified && <PasswordStrengthHint password={password} context={{ email }} />}
          </label>

          {!otpSent ? (
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {t("auth.otp.send")}
            </button>
          ) : !otpVerified ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{t("auth.otp.enter")}</span>
                <span className={expired ? "font-semibold text-red-500" : "font-semibold text-blue-600 dark:text-blue-400"}>
                  {expired ? t("auth.otp.expired") : fmtTimer(secondsLeft)}
                </span>
              </div>
              <OtpInput value={otp} onChange={setOtp} disabled={expired} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={checkOtp}
                  disabled={loading || otp.length !== 6 || expired}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                  {t("auth.otp.verify")}
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400/60 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                >
                  {t("auth.otp.resend")}
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {t("auth.otp.verified")}
            </p>
          )}

          {info && <p className="text-xs text-slate-500 dark:text-slate-400">{info}</p>}
          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          {otpVerified && (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {t("auth.signup.submit")}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
