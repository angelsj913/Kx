"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { PLANS, type PlanId, isPlanId } from "@/lib/plans";

const PLAN_STYLE: Record<string, string> = {
  free: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  professional: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
};

const PLAN_OPTIONS: PlanId[] = ["free", "pro", "professional"];

type Props = {
  userId: string;
  userEmail: string | null;
  userLabel: string;
  initialPlan: string;
};

export default function AdminUserPlanControl({
  userId,
  userEmail,
  userLabel,
  initialPlan,
}: Props) {
  const [plan, setPlan] = useState<string>(
    isPlanId(initialPlan) ? initialPlan : "free"
  );
  const [draft, setDraft] = useState<PlanId>(
    isPlanId(initialPlan) ? initialPlan : "free"
  );
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "otp">("confirm");
  const [otp, setOtp] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  function openModal() {
    if (!isPlanId(draft) || draft === plan) return;
    setStep("confirm");
    setOtp("");
    setError("");
    setOkMsg("");
    setDevCode(undefined);
    setSentTo("");
    setOpen(true);
  }

  async function sendOtp() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", plan: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "인증번호 발송에 실패했습니다.");
      setSentTo(data.sentTo ?? "");
      setDevCode(typeof data.devCode === "string" ? data.devCode : undefined);
      if (data.mailError && data.devCode) {
        // 메일은 실패했지만 화면 코드로 진행 가능
        setError(String(data.mailError));
      }
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function applyChange() {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("6자리 인증번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change", plan: draft, code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "요금제 변경에 실패했습니다.");
      setPlan(draft);
      setOkMsg(data.message ?? "요금제가 변경되었습니다.");
      setTimeout(() => {
        setOpen(false);
        setOkMsg("");
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const fromName = isPlanId(plan) ? PLANS[plan].name : plan;
  const toName = PLANS[draft].name;
  const changed = draft !== plan;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
          PLAN_STYLE[plan] ?? PLAN_STYLE.free
        }`}
      >
        {plan}
      </span>

      <select
        value={draft}
        onChange={(e) => setDraft(e.target.value as PlanId)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        aria-label="요금제 선택"
      >
        {PLAN_OPTIONS.map((id) => (
          <option key={id} value={id}>
            {PLANS[id].name}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={!changed}
        onClick={openModal}
        className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-600"
      >
        변경
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    요금제 변경 (2단계 인증)
                  </h2>
                  <p className="text-[11px] text-slate-500">관리자 이메일 인증 후 적용됩니다</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-slate-500">대상 회원</p>
              <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                {userLabel}
                {userEmail ? (
                  <span className="ml-1 font-normal text-slate-500">({userEmail})</span>
                ) : null}
              </p>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                <span className="font-medium">{fromName}</span>
                <span className="mx-1.5 text-slate-400">→</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{toName}</span>
              </p>
            </div>

            {step === "confirm" && (
              <div className="mt-4 space-y-3">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  실수·오남용 방지를 위해 관리자 계정 이메일로 인증번호를 보냅니다.
                  인증 후에만 요금제가 변경됩니다.
                </p>
                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendOtp()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  인증 메일 보내기
                </button>
              </div>
            )}

            {step === "otp" && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {sentTo ? (
                    <>
                      <strong>{sentTo}</strong> 으로 보낸 6자리 코드를 입력하세요. (3분 유효)
                    </>
                  ) : (
                    "이메일로 받은 6자리 코드를 입력하세요."
                  )}
                </p>
                {devCode && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
                    <p className="text-[11px] font-semibold">
                      메일 미도착 · 화면 인증번호 (관리자 폴백)
                    </p>
                    <p className="mt-1 text-center font-mono text-2xl font-bold tracking-[0.35em]">
                      {devCode}
                    </p>
                    <p className="mt-2 text-[10px] leading-relaxed opacity-80">
                      Vercel에 SMTP 또는 RESEND_API_KEY 를 등록하면 이메일로 발송됩니다.
                      Resend 무료 플랜은 인증된 수신 주소만 받을 수 있습니다.
                    </p>
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    {error}
                  </p>
                )}
                {okMsg && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {okMsg}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void sendOtp()}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    재발송
                  </button>
                  <button
                    type="button"
                    disabled={busy || otp.length !== 6}
                    onClick={() => void applyChange()}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    변경 확정
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
