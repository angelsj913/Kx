"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Copy, Check, Loader2 } from "lucide-react";
import { useAppLanguage, type AppLanguage } from "@/lib/i18n";

type Copy = {
  title: string;
  desc: string;
  yourCode: string;
  copy: string;
  copied: string;
  referred: string; // "{n}명 초대 성공"
  activeGrant: string; // "Pro 체험 {date}까지"
  redeemLabel: string;
  redeemPlaceholder: string;
  redeem: string;
  redeemed: string; // "Pro {n}일이 지급되었어요!"
  genericError: string;
  loading: string;
};

const COPY: Partial<Record<AppLanguage, Copy>> & { en: Copy; ko: Copy } = {
  ko: {
    title: "친구 초대하고 Pro 받기",
    desc: "친구가 내 코드를 입력하면 두 사람 모두 Pro 7일을 받습니다. 초대는 계정당 최대 20명, Pro 체험은 최대 28일까지 쌓입니다.",
    yourCode: "내 추천 코드",
    copy: "복사",
    copied: "복사됨!",
    referred: "명 초대 성공",
    activeGrant: "까지 Pro 체험 중",
    redeemLabel: "추천 코드 입력",
    redeemPlaceholder: "친구에게 받은 코드",
    redeem: "적용",
    redeemed: "일 Pro가 지급되었어요!",
    genericError: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    loading: "불러오는 중…",
  },
  en: {
    title: "Invite friends, get Pro",
    desc: "When a friend enters your code, you both get 7 days of Pro. Max 20 successful invites per account; Pro trial stacks up to 28 days.",
    yourCode: "Your referral code",
    copy: "Copy",
    copied: "Copied!",
    referred: " referred",
    activeGrant: " — Pro trial active until",
    redeemLabel: "Enter a referral code",
    redeemPlaceholder: "Code from a friend",
    redeem: "Apply",
    redeemed: " days of Pro added!",
    genericError: "Something went wrong. Please try again shortly.",
    loading: "Loading…",
  },
};

type Status = {
  code: string;
  referredCount: number;
  maxReferrals?: number;
  remainingInvites?: number;
  activeGrant: { plan: string; until: string } | null;
};

export default function ReferralCard() {
  const language = useAppLanguage();
  const c = COPY[language] ?? COPY.en;

  const [status, setStatus] = useState<Status | null>(null);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/referral");
      const data = await res.json().catch(() => ({}));
      if (res.ok) setStatus(data as Status);
    } catch {
      /* keep loading state */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCopy() {
    if (!status?.code) return;
    try {
      await navigator.clipboard.writeText(status.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function onRedeem(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const res = await fetch("/api/account/referral/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || c.genericError);
        return;
      }
      setSuccess(`${data.rewardDays}${c.redeemed}`);
      setCode("");
      await load();
    } catch {
      setError(c.genericError);
    } finally {
      setBusy(false);
    }
  }

  const cardCls =
    "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900";

  if (!status) {
    return (
      <div className={`${cardCls} mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400`}>
        <Loader2 className="h-4 w-4 animate-spin" /> {c.loading}
      </div>
    );
  }

  return (
    <div className={`${cardCls} mb-4`}>
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{c.title}</h3>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{c.desc}</p>

      {/* 내 코드 */}
      <div className="mt-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{c.yourCode}</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-center text-base font-bold tracking-[0.2em] text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50">
            {status.code}
          </code>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? c.copied : c.copy}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>
            <b className="text-slate-700 dark:text-slate-200">{status.referredCount}</b>
            {c.referred}
            {typeof status.maxReferrals === "number" && (
              <span className="text-slate-400"> / {status.maxReferrals}</span>
            )}
          </span>
          {typeof status.remainingInvites === "number" && (
            <span>
              남은 초대 {status.remainingInvites}명
            </span>
          )}
          {status.activeGrant && (
            <span className="text-blue-600 dark:text-blue-300">
              {new Date(status.activeGrant.until).toLocaleDateString()}
              {c.activeGrant}
            </span>
          )}
        </div>
      </div>

      {/* 코드 입력 */}
      <form className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800" onSubmit={onRedeem}>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{c.redeemLabel}</p>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder={c.redeemPlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase tracking-wider text-slate-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 outline-none transition-colors focus:border-blue-500/70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={busy || code.length < 4}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {c.redeem}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-300">{error}</p>}
        {success && <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">{success}</p>}
      </form>
    </div>
  );
}
