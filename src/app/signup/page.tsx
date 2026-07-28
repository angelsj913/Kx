"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useLandingT } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import OtpInput from "@/components/auth/OtpInput";
import PasswordStrengthHint from "@/components/auth/PasswordStrengthHint";
import Logo from "@/components/ui/Logo";
import { checkPasswordStrength } from "@/lib/password";
import { useOtpFlow, fmtOtpTimer } from "@/lib/useOtpFlow";

function SignupCard() {
  const t = useLandingT();
  const searchParams = useSearchParams();
  const fromGoogle = searchParams.get("from") === "google";
  const { data: session, status } = useSession();
  const sessionEmail = session?.user?.email?.trim().toLowerCase() ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpFlow = useOtpFlow("signup");
  const { otpSent, otp, setOtp, otpVerified, secondsLeft, expired, info } = otpFlow;
  const effectiveEmail = fromGoogle ? sessionEmail : email;

  useEffect(() => {
    if (fromGoogle && status === "authenticated" && sessionEmail) {
      setEmail(sessionEmail);
    }
  }, [fromGoogle, sessionEmail, status]);

  useEffect(() => {
    if (fromGoogle && status === "unauthenticated") {
      window.location.replace("/login?callbackUrl=/signup%3Ffrom%3Dgoogle");
    }
  }, [fromGoogle, status]);

  async function handleSendOtp() {
    const strength = checkPasswordStrength(password, { email });
    if (!strength.ok) {
      otpFlow.setError(strength.reason ?? "비밀번호 조건을 확인해 주세요.");
      return;
    }
    await otpFlow.sendOtp(email);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (fromGoogle) {
      if (status !== "authenticated") {
        setError("구글 로그인 후 비밀번호를 설정해 주세요.");
        return;
      }
      if (!sessionEmail) {
        setError("세션 이메일을 확인할 수 없습니다. 다시 로그인해 주세요.");
        return;
      }
      if (password !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다.");
        return;
      }
      if (!termsAccepted) {
        setError("이용약관과 개인정보 처리방침에 동의해 주세요.");
        return;
      }

      const strength = checkPasswordStrength(password, { email: sessionEmail });
      if (!strength.ok) {
        setError(strength.reason ?? "비밀번호 조건을 확인해 주세요.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/complete-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "비밀번호 설정에 실패했습니다.");
        window.location.href = "/app";
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        setLoading(false);
      }
      return;
    }

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

  const otpError = otpFlow.error;
  const displayError = error || otpError;

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
        <h1 className="text-2xl font-bold">
          {fromGoogle ? "비밀번호 설정" : t("auth.signup.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {fromGoogle
            ? "Google 계정 이메일로 ZEFF AI 비밀번호를 설정해 주세요."
            : t("auth.signup.subtitle")}
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("auth.field.email")}
            </span>
            <input
              type="email"
              value={effectiveEmail}
              onChange={(e) => setEmail(e.target.value)}
              disabled={fromGoogle || otpVerified}
              readOnly={fromGoogle}
              required
              placeholder={fromGoogle && status === "loading" ? "Google 세션 확인 중…" : "you@example.com"}
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
              disabled={fromGoogle ? loading || status !== "authenticated" : otpVerified}
              required
              placeholder={t("auth.field.passwordHint")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {(fromGoogle || !otpVerified) && (
              <PasswordStrengthHint password={password} context={{ email: effectiveEmail }} />
            )}
          </label>

          {fromGoogle && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                비밀번호 확인
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || status !== "authenticated"}
                required
                placeholder="비밀번호를 한 번 더 입력해 주세요."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          )}

          {!fromGoogle && !otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpFlow.loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {t("auth.otp.send")}
            </button>
          ) : !fromGoogle && !otpVerified ? (
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
                  onClick={handleSendOtp}
                  disabled={otpFlow.loading}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400/60 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                >
                  {t("auth.otp.resend")}
                </button>
              </div>
            </div>
          ) : !fromGoogle ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {t("auth.otp.verified")}
            </p>
          ) : null}

          {fromGoogle && (
            <>
              <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>{t("auth.signup.consent")}</span>
              </label>
              <button
                type="submit"
                disabled={loading || status !== "authenticated" || !sessionEmail}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? "설정 중…" : "비밀번호 설정 완료"}
              </button>
            </>
          )}

          {info && <p className="text-xs text-slate-500 dark:text-slate-400">{info}</p>}
          {displayError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {displayError}
            </p>
          )}

          {!fromGoogle && otpVerified && (
            <>
              <Link
                href="/support/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-[11px] leading-relaxed text-slate-400 underline-offset-2 hover:text-blue-500 hover:underline dark:text-slate-500"
              >
                {t("auth.signup.consent")}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
              >
                {t("auth.signup.submit")}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupCard />
    </Suspense>
  );
}
