"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { KeyRound, ShieldCheck, LogOut, MonitorSmartphone, Loader2 } from "lucide-react";
import { useAppLanguage, type AppLanguage } from "@/lib/i18n";

type SecCopy = {
  pwTitle: string;
  pwDesc: string;
  pwCurrent: string;
  pwNew: string;
  pwSubmit: string;
  pwSuccess: string;
  pwGoogleOnly: string;
  twoFaTitle: string;
  twoFaDesc: string;
  statusOn: string;
  statusOff: string;
  enable: string;
  disable: string;
  codeSent: string;
  codePlaceholder: string;
  confirm: string;
  cancel: string;
  logoutTitle: string;
  logoutDesc: string;
  logoutButton: string;
  logoutConfirm: string;
  loginsTitle: string;
  loginsEmpty: string;
  genericError: string;
  loading: string;
};

// 앱 사전(i18n.ts)을 키로 부풀리지 않도록, ThemeToggle·FeatureShowcase처럼 로컬 사전을 둔다.
// ko·en은 완역, 나머지 언어는 en으로 폴백한다(설정 하위 화면).
const COPY: Partial<Record<AppLanguage, SecCopy>> & { en: SecCopy; ko: SecCopy } = {
  ko: {
    pwTitle: "비밀번호 변경",
    pwDesc: "현재 비밀번호를 확인한 뒤 새 비밀번호로 바꿉니다.",
    pwCurrent: "현재 비밀번호",
    pwNew: "새 비밀번호",
    pwSubmit: "비밀번호 변경",
    pwSuccess: "비밀번호가 변경되었습니다.",
    pwGoogleOnly: "구글 로그인 계정입니다. 비밀번호는 구글 계정에서 관리해 주세요.",
    twoFaTitle: "2단계 인증",
    twoFaDesc: "로그인할 때 이메일로 받은 6자리 코드를 추가로 입력합니다.",
    statusOn: "사용 중",
    statusOff: "사용 안 함",
    enable: "사용 설정",
    disable: "사용 해제",
    codeSent: "이메일로 인증번호를 보냈어요. 3분 안에 입력해 주세요.",
    codePlaceholder: "인증번호 6자리",
    confirm: "확인",
    cancel: "취소",
    logoutTitle: "모든 기기에서 로그아웃",
    logoutDesc: "이 계정으로 로그인된 모든 기기의 세션을 종료합니다. 이 기기도 다시 로그인해야 합니다.",
    logoutButton: "모든 기기에서 로그아웃",
    logoutConfirm: "모든 기기에서 로그아웃할까요? 이 기기도 로그아웃됩니다.",
    loginsTitle: "최근 로그인",
    loginsEmpty: "최근 로그인 기록이 없습니다.",
    genericError: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    loading: "불러오는 중…",
  },
  en: {
    pwTitle: "Change password",
    pwDesc: "Confirm your current password, then set a new one.",
    pwCurrent: "Current password",
    pwNew: "New password",
    pwSubmit: "Change password",
    pwSuccess: "Your password has been changed.",
    pwGoogleOnly: "This is a Google account. Manage your password in your Google account.",
    twoFaTitle: "Two-factor authentication",
    twoFaDesc: "Enter a 6-digit code emailed to you each time you sign in.",
    statusOn: "On",
    statusOff: "Off",
    enable: "Enable",
    disable: "Disable",
    codeSent: "We emailed you a code. Enter it within 3 minutes.",
    codePlaceholder: "6-digit code",
    confirm: "Confirm",
    cancel: "Cancel",
    logoutTitle: "Log out of all devices",
    logoutDesc: "Ends every session signed in to this account. You'll need to sign in again on this device too.",
    logoutButton: "Log out of all devices",
    logoutConfirm: "Log out of all devices? This device will be logged out too.",
    loginsTitle: "Recent sign-ins",
    loginsEmpty: "No recent sign-ins.",
    genericError: "Something went wrong. Please try again shortly.",
    loading: "Loading…",
  },
};

type RecentLogin = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  provider: string | null;
  createdAt: string;
};

type SecurityState = {
  twoFactorEnabled: boolean;
  hasPassword: boolean;
  recentLogins: RecentLogin[];
};

function shortUA(ua: string | null): string {
  if (!ua) return "";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua)
      ? "macOS"
      : /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad|iOS/i.test(ua)
          ? "iOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome\//i.test(ua)
      ? "Chrome"
      : /Firefox\//i.test(ua)
        ? "Firefox"
        : /Safari\//i.test(ua)
          ? "Safari"
          : "";
  return [browser, os].filter(Boolean).join(" · ") || ua.slice(0, 40);
}

export default function SecurityPanel() {
  const language = useAppLanguage();
  const c = COPY[language] ?? COPY.en;

  const [state, setState] = useState<SecurityState | null>(null);
  const [error, setError] = useState("");

  // 비밀번호 변경
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  // 2FA 설정
  const [twoFaMode, setTwoFaMode] = useState<"idle" | "code">("idle");
  const [twoFaEnableTarget, setTwoFaEnableTarget] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaBusy, setTwoFaBusy] = useState(false);
  const [twoFaNotice, setTwoFaNotice] = useState("");

  const [logoutBusy, setLogoutBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/security");
      const data = await res.json().catch(() => ({}));
      if (res.ok) setState(data as SecurityState);
    } catch {
      /* ignore — 화면은 로딩 상태 유지 */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPwDone(false);
    setPwBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || c.genericError);
        return;
      }
      setPwDone(true);
      setCurPw("");
      setNewPw("");
    } catch {
      setError(c.genericError);
    } finally {
      setPwBusy(false);
    }
  }

  async function startTwoFa(target: boolean) {
    setError("");
    setTwoFaNotice("");
    setTwoFaBusy(true);
    try {
      const res = await fetch("/api/account/2fa/send-code", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || c.genericError);
        return;
      }
      setTwoFaEnableTarget(target);
      setTwoFaMode("code");
      setTwoFaNotice(data?.devCode ? `${c.codeSent} (${data.devCode})` : c.codeSent);
    } catch {
      setError(c.genericError);
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function confirmTwoFa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTwoFaBusy(true);
    try {
      const res = await fetch("/api/account/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: twoFaEnableTarget, code: twoFaCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || c.genericError);
        return;
      }
      setTwoFaMode("idle");
      setTwoFaCode("");
      setTwoFaNotice("");
      await load();
    } catch {
      setError(c.genericError);
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function onLogoutAll() {
    if (!window.confirm(c.logoutConfirm)) return;
    setLogoutBusy(true);
    try {
      const res = await fetch("/api/account/logout-all", { method: "POST" });
      if (res.ok) {
        // 다른 기기는 sessionVersion 증가로 무효화됨. 현재 기기 쿠키는 signOut으로 깔끔히 정리.
        await signOut({ callbackUrl: "/login" });
        return;
      }
      setError(c.genericError);
    } catch {
      setError(c.genericError);
    } finally {
      setLogoutBusy(false);
    }
  }

  if (!state) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> {c.loading}
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-500/70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500";
  const cardCls =
    "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {/* 비밀번호 변경 */}
      <section className={cardCls}>
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{c.pwTitle}</h3>
        </div>
        {state.hasPassword ? (
          <form className="mt-3 space-y-2.5" onSubmit={onChangePassword}>
            <p className="text-xs text-slate-500 dark:text-slate-400">{c.pwDesc}</p>
            <input
              type="password"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
              required
              autoComplete="current-password"
              placeholder={c.pwCurrent}
              className={inputCls}
            />
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              autoComplete="new-password"
              placeholder={c.pwNew}
              className={inputCls}
            />
            {pwDone && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{c.pwSuccess}</p>
            )}
            <button
              type="submit"
              disabled={pwBusy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {pwBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {c.pwSubmit}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{c.pwGoogleOnly}</p>
        )}
      </section>

      {/* 2단계 인증 */}
      {state.hasPassword && (
        <section className={cardCls}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{c.twoFaTitle}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  state.twoFactorEnabled
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {state.twoFactorEnabled ? c.statusOn : c.statusOff}
              </span>
            </div>
            {twoFaMode === "idle" && (
              <button
                type="button"
                disabled={twoFaBusy}
                onClick={() => startTwoFa(!state.twoFactorEnabled)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                  state.twoFactorEnabled
                    ? "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {twoFaBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {state.twoFactorEnabled ? c.disable : c.enable}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{c.twoFaDesc}</p>
          {twoFaMode === "code" && (
            <form className="mt-3 space-y-2" onSubmit={confirmTwoFa}>
              {twoFaNotice && (
                <p className="text-xs text-blue-600 dark:text-blue-300">{twoFaNotice}</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder={c.codePlaceholder}
                  autoFocus
                  className={inputCls}
                />
                <button
                  type="submit"
                  disabled={twoFaBusy || twoFaCode.length < 6}
                  className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                  {c.confirm}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFaMode("idle");
                    setTwoFaCode("");
                    setTwoFaNotice("");
                  }}
                  className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {c.cancel}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* 최근 로그인 */}
      <section className={cardCls}>
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{c.loginsTitle}</h3>
        </div>
        {state.recentLogins.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{c.loginsEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {state.recentLogins.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/40"
              >
                <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">
                  {shortUA(l.userAgent) || l.provider || "—"}
                  {l.ip ? <span className="text-slate-400 dark:text-slate-500"> · {l.ip}</span> : null}
                </span>
                <span className="shrink-0 text-slate-400 dark:text-slate-500">
                  {new Date(l.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 모든 기기 로그아웃 */}
      <section className={cardCls}>
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4 text-rose-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{c.logoutTitle}</h3>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{c.logoutDesc}</p>
        <button
          type="button"
          disabled={logoutBusy}
          onClick={onLogoutAll}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
        >
          {logoutBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {c.logoutButton}
        </button>
      </section>
    </div>
  );
}
