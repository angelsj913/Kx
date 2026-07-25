"use client";

import { useEffect, useState } from "react";

export function fmtOtpTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** signup/find-password가 공유하는 이메일 OTP 발송·검증 흐름 (타이머 포함). */
export function useOtpFlow(purpose: "signup" | "find-password") {
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

  async function sendOtp(identifier: string) {
    setError("");
    setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return false;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", identifier, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "발송에 실패했습니다.");
      setOtpSent(true);
      setOtp("");
      setOtpVerified(false);
      setSecondsLeft(180);
      if (data.devCode) setInfo(`(개발용) 인증번호: ${data.devCode}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function checkOtp(identifier: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", identifier, purpose, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "인증에 실패했습니다.");
      setOtpVerified(true);
      setSecondsLeft(0);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    otpSent,
    otp,
    setOtp,
    otpVerified,
    secondsLeft,
    expired,
    loading,
    error,
    setError,
    info,
    sendOtp,
    checkOtp,
  };
}
