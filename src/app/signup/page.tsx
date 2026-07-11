"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { CheckCircle2 } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import OtpInput from "@/components/auth/OtpInput";

const DIAL_CODES = [
  { code: "+82", label: "🇰🇷 +82" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+7", label: "🇷🇺 +7" },
];

function fmtTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SignupPage() {
  const t = useLandingT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dialCode, setDialCode] = useState("+82");
  const [phone, setPhone] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // 전화번호 SMS 인증 (선택)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneSeconds, setPhoneSeconds] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  useEffect(() => {
    if (phoneSeconds <= 0) return;
    const id = setInterval(() => setPhoneSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [phoneSeconds]);

  const phoneId = `${dialCode}${phone}`;
  const phoneExpired = phoneOtpSent && phoneSeconds <= 0 && !phoneVerified;

  const expired = otpSent && secondsLeft <= 0 && !otpVerified;

  async function sendOtp() {
    setError("");
    setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", identifier: email, channel: "email", purpose: "signup" }),
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
      const res = await fetch("/api/auth/verify", {
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

  async function sendPhoneOtp() {
    setError("");
    setInfo("");
    if (phone.replace(/\D/g, "").length < 8) {
      setError("전화번호를 정확히 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", identifier: phoneId, channel: "sms", purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "발송에 실패했습니다.");
      setPhoneOtpSent(true);
      setPhoneOtp("");
      setPhoneVerified(false);
      setPhoneSeconds(180);
      if (data.devCode) setInfo(`(개발용) 문자 인증번호: ${data.devCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function checkPhoneOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", identifier: phoneId, purpose: "signup", code: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "인증에 실패했습니다.");
      setPhoneVerified(true);
      setPhoneSeconds(0);
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
        body: JSON.stringify({ email, password, dialCode, phone, phoneId, phoneVerified }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "가입에 실패했습니다.");
      await signIn("credentials", { email, password, callbackUrl: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-3.5">
          <BackButton fallbackHref="/login" />
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-zeff.png" alt="ZEFF AI" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-bold tracking-tight">ZEFF AI</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-2xl font-bold">{t("auth.signup.title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("auth.signup.subtitle")}</p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
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
          </label>

          <div className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("auth.field.phone")}
            </span>
            <div className="flex gap-2">
              <select
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
                className="shrink-0 rounded-xl border border-slate-300 bg-white px-2.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {DIAL_CODES.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                disabled={phoneVerified}
                placeholder={t("auth.field.phoneHint")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {!phoneOtpSent && !phoneVerified && (
                <button
                  type="button"
                  onClick={sendPhoneOtp}
                  disabled={loading || phone.length < 8}
                  className="shrink-0 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-400/60 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                >
                  번호 인증
                </button>
              )}
            </div>

            {/* 전화번호 SMS 인증 (선택) */}
            {phoneVerified ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                <CheckCircle2 className="h-4 w-4" /> 전화번호 인증 완료
              </p>
            ) : phoneOtpSent ? (
              <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">문자로 받은 6자리 입력</span>
                  <span className={phoneExpired ? "font-semibold text-red-500" : "font-semibold text-blue-600 dark:text-blue-400"}>
                    {phoneExpired ? "만료됨" : fmtTimer(phoneSeconds)}
                  </span>
                </div>
                <OtpInput value={phoneOtp} onChange={setPhoneOtp} disabled={phoneExpired} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={checkPhoneOtp}
                    disabled={loading || phoneOtp.length !== 6 || phoneExpired}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    onClick={sendPhoneOtp}
                    disabled={loading}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400/60 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    재발송
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                전화번호 인증은 선택입니다. (문자 인증을 원하면 &apos;번호 인증&apos;을 누르세요)
              </p>
            )}
          </div>

          {/* 이메일 OTP */}
          {!otpVerified ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {!otpSent ? (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className="w-full rounded-xl border border-blue-500/50 bg-blue-600/10 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-600/20 disabled:opacity-60 dark:text-blue-300"
                >
                  {t("auth.otp.send")}
                </button>
              ) : (
                <div className="space-y-3">
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
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm font-medium text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              <CheckCircle2 className="h-5 w-5" />
              {t("auth.otp.verified")}
            </div>
          )}

          {info && <p className="text-xs text-slate-500 dark:text-slate-400">{info}</p>}
          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          {/* 약관 동의 문구 */}
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {t("auth.agree.prefix")}{" "}
            <Link href="/support/legal#terms" target="_blank" className="text-blue-600 underline dark:text-blue-400">
              {t("support.legal.termsTitle")}
            </Link>
            {", "}
            <Link href="/support/legal#privacy" target="_blank" className="text-blue-600 underline dark:text-blue-400">
              {t("support.legal.privacyTitle")}
            </Link>
            {", "}
            <Link href="/support/legal#consent" target="_blank" className="text-blue-600 underline dark:text-blue-400">
              {t("support.legal.consentTitle")}
            </Link>
            {t("auth.agree.suffix")}
          </p>

          <button
            type="submit"
            disabled={loading || !otpVerified}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-blue-500 disabled:opacity-50"
          >
            {t("auth.signup.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
