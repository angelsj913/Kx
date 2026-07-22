"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminVerifyClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/security/mfa/send", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "발송 실패");
      setSent(true);
      if (data.devCode) setDevCode(data.devCode);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/security/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "인증 실패");
      router.push("/admin/security");
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-xl font-bold">관리자 2단계 인증</h1>
      <p className="mt-2 text-sm text-slate-500">
        보안 콘솔 접근을 위해 등록된 관리자 이메일로 OTP를 확인합니다.
      </p>
      {!sent ? (
        <button
          type="button"
          disabled={loading}
          onClick={sendCode}
          className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "발송 중…" : "인증 코드 받기"}
        </button>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-3">
          {devCode && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              개발 모드 코드: <strong>{devCode}</strong>
            </p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6자리 코드"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-lg tracking-widest dark:border-slate-700 dark:bg-slate-950"
            maxLength={6}
            inputMode="numeric"
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "확인 중…" : "확인"}
          </button>
        </form>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
