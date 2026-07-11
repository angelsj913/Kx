"use client";

import { useEffect, useState } from "react";
import { useLandingT } from "@/lib/landingI18n";
import OtpInput from "./OtpInput";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** 이메일 입력 → OTP 발송/검증까지 처리하고, 성공 시 onVerified(email)를 호출한다. */
export default function EmailOtpVerifier({
  purpose,
  onVerified,
}: {
  purpose: "find-id" | "find-password";
  onVerified: (email: string) => void;
}) {
  const t = useLandingT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const expired = sent && secondsLeft <= 0;

  async function send() {
    setError("");
    setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", identifier: email, channel: "email", purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "발송에 실패했습니다.");
      setSent(true);
      setOtp("");
      setSecondsLeft(180);
      if (data.devCode) setInfo(`(개발용) 인증번호: ${data.devCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function check() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", identifier: email, purpose, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "인증에 실패했습니다.");
      onVerified(email.trim().toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("auth.field.email")}
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={sent}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>

      {!sent ? (
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {t("auth.otp.send")}
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t("auth.otp.enter")}</span>
            <span className={expired ? "font-semibold text-red-500" : "font-semibold text-blue-600 dark:text-blue-400"}>
              {expired ? t("auth.otp.expired") : fmt(secondsLeft)}
            </span>
          </div>
          <OtpInput value={otp} onChange={setOtp} disabled={expired} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={check}
              disabled={loading || otp.length !== 6 || expired}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {t("auth.otp.verify")}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400/60 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
            >
              {t("auth.otp.resend")}
            </button>
          </div>
        </div>
      )}

      {info && <p className="text-xs text-slate-500 dark:text-slate-400">{info}</p>}
      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
