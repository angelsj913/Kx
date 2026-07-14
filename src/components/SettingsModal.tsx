"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Settings2,
  Shield,
  CreditCard,
  Database,
  Sparkles,
  Info,
  ExternalLink,
  Check,
  Trash2,
  Plus,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { PLANS, type PlanId, isPlanId } from "@/lib/plans";
import {
  useT,
  LANGUAGE_ORDER,
  LANGUAGE_LABELS,
  type AppLanguage,
  type AppDictKey,
} from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import { COMPANY_INFO } from "@/lib/legalContent";

type Tab =
  | "general"
  | "privacy"
  | "billing"
  | "data"
  | "plan"
  | "about";

const TABS: { id: Tab; label: string; icon: typeof Settings2 }[] = [
  { id: "general", label: "일반", icon: Settings2 },
  { id: "privacy", label: "개인정보·보안", icon: Shield },
  { id: "billing", label: "결제", icon: CreditCard },
  { id: "data", label: "데이터", icon: Database },
  { id: "plan", label: "요금제", icon: Sparkles },
  { id: "about", label: "앱 정보", icon: Info },
];

const LEGAL_LINKS = [
  { label: "이용약관", href: "/support/legal#terms" },
  { label: "개인정보 수집 이용 동의서", href: "/support/legal#consent" },
  { label: "개인정보처리방침", href: "/support/legal#privacy" },
];

const BRAND_LABEL: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  local: "국내카드",
  card: "카드",
};

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("general");
  // SSR/포털용 마운트 여부 — effect setState 대신 useSyncExternalStore
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    // 스크롤 잠금
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // document.body 포털 — 사이드바 transform 안에 갇히지 않도록
  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="설정"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 flex h-[min(90vh,720px)] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          {/* 좌측 탭 — 모바일에서는 상단 스크롤 */}
          <nav className="flex w-14 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-slate-200 bg-slate-50 p-2 sm:w-48 sm:p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <p className="mb-2 hidden px-2 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:block">
              설정
            </p>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors sm:px-3 ${
                  tab === id
                    ? "bg-blue-600/10 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {TABS.find((t) => t.id === tab)?.label ?? "설정"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {tab === "general" && <GeneralPanel />}
              {tab === "privacy" && <PrivacyPanel />}
              {tab === "billing" && <BillingPanel />}
              {tab === "data" && <DataPanel />}
              {tab === "plan" && <PlanPanel />}
              {tab === "about" && <AboutPanel />}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}

function GeneralPanel() {
  const t = useT();
  const { settings, updateLanguage, updatePlan } = useSettings();
  // 서버 설정이 진실 소스 (effect로 로컬 state 동기화하지 않음)
  const lang: AppLanguage =
    settings?.language && LANGUAGE_ORDER.includes(settings.language as AppLanguage)
      ? (settings.language as AppLanguage)
      : "ko";

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t("settings.language.label")}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{t("settings.language.hint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LANGUAGE_ORDER.map((l) => (
            <button
              key={l}
              type="button"
              onClick={async () => {
                await updateLanguage(l);
              }}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                lang === l
                  ? "border-blue-500 bg-blue-600/10 text-blue-700 dark:text-blue-300"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t("settings.plan.current")}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {settings?.plan ? PLANS[isPlanId(settings.plan) ? settings.plan : "free"].name : "…"}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          요금제 변경은 왼쪽 「요금제」 탭에서 할 수 있습니다.
        </p>
        {/* 개발/테스트용 빠른 전환 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(PLANS) as PlanId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => updatePlan(id)}
              className="rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-[11px] text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:border-slate-600"
            >
              테스트: {PLANS[id].name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function PrivacyPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        홈페이지 지원 센터의 약관을 새 탭에서 확인할 수 있습니다.
      </p>
      <ul className="space-y-2">
        {LEGAL_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-blue-400/50 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-100 dark:hover:border-blue-500/40"
            >
              {link.label}
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

type OrderRow = {
  id: string;
  merchantUid?: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

function BillingPanel() {
  const t = useT();
  const [methods, setMethods] = useState<
    { id: string; brand: string; last4: string; holder: string | null }[]
  >([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [brand, setBrand] = useState("visa");
  const [last4, setLast4] = useState("");
  const [holder, setHolder] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, o] = await Promise.all([
      fetch("/api/billing/methods").then((r) => r.json()),
      fetch("/api/billing/orders").then((r) => r.json()),
    ]);
    if (m.methods) setMethods(m.methods);
    if (o.orders) setOrders(o.orders);
  }, []);

  // await 이후 setState — 동기 effect setState 회피
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [m, o] = await Promise.all([
          fetch("/api/billing/methods").then((r) => r.json()),
          fetch("/api/billing/orders").then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (m.methods) setMethods(m.methods);
        if (o.orders) setOrders(o.orders);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addMethod() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/methods", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brand, last4, holder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "추가 실패");
      setLast4("");
      setHolder("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setBusy(false);
    }
  }

  async function removeMethod(id: string) {
    setError("");
    const res = await fetch("/api/billing/methods", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "해지 실패");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">결제수단</h3>
        <p className="mt-1 text-xs text-slate-500">
          자체 저장 UI입니다. 실제 결제 플랫폼은 추후 연동됩니다.
        </p>
        <ul className="mt-3 space-y-2">
          {methods.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-600">
              등록된 결제수단이 없습니다
            </li>
          )}
          {methods.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-14 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-slate-100 dark:text-slate-900">
                  {m.brand === "visa"
                    ? "VISA"
                    : m.brand === "mastercard"
                      ? "MC"
                      : m.brand === "amex"
                        ? "AMEX"
                        : "CARD"}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {BRAND_LABEL[m.brand] ?? m.brand} ···· {m.last4}
                  </p>
                  {m.holder && (
                    <p className="text-[11px] text-slate-500">{m.holder}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeMethod(m.id)}
                disabled={methods.length <= 1}
                title={methods.length <= 1 ? "결제수단이 1개일 때는 해지할 수 없습니다" : "해지"}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-4 dark:border-slate-700">
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="amex">Amex</option>
            <option value="local">국내카드</option>
          </select>
          <input
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="끝 4자리"
            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            placeholder="소유자명(선택)"
            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void addMethod()}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> 추가
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">결제내역</h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/60">
              <tr>
                <th className="px-3 py-2 font-medium">결제일</th>
                <th className="px-3 py-2 font-medium">금액</th>
                <th className="px-3 py-2 font-medium">정보</th>
                <th className="px-3 py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                    결제 내역이 없습니다
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-blue-950/20"
                  onClick={() => setSelectedOrder(o)}
                >
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {new Date(o.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                    ₩{o.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {o.plan} 플랜
                  </td>
                  <td className="px-3 py-2 text-slate-500">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          결제된 요금제 행을 선택하면 영수증·세부정보를 볼 수 있습니다.
        </p>
      </section>

      {selectedOrder && (
        <ReceiptModal order={selectedOrder} onClose={() => setSelectedOrder(null)} t={t} />
      )}
    </div>
  );
}

function ReceiptModal({
  order,
  onClose,
  t,
}: {
  order: OrderRow;
  onClose: () => void;
  t: (k: AppDictKey) => string;
}) {
  const isPaid = order.status === "paid";
  const title = isPaid ? t("billing.receipt") : t("billing.orderDetail");

  function printReceipt() {
    const w = window.open("", "_blank", "width=480,height=720");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${title}</title>
<style>
  body{font-family:system-ui,sans-serif;padding:32px;color:#0f172a}
  h1{font-size:18px;margin:0 0 8px}
  .meta{color:#64748b;font-size:12px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:8px 0;border-bottom:1px solid #e2e8f0}
  td:last-child{text-align:right;font-weight:600}
  .footer{margin-top:28px;font-size:11px;color:#94a3b8}
</style></head><body>
  <h1>ZEFF AI · ${title}</h1>
  <p class="meta">${COMPANY_INFO.serviceName} · ${COMPANY_INFO.contactEmail}</p>
  <table>
    <tr><td>${t("billing.merchantUid")}</td><td>${order.merchantUid || order.id}</td></tr>
    <tr><td>${t("billing.plan")}</td><td>${order.plan}</td></tr>
    <tr><td>${t("billing.amount")}</td><td>₩${order.amount.toLocaleString()} ${order.currency?.toUpperCase() || ""}</td></tr>
    <tr><td>${t("billing.status")}</td><td>${order.status}</td></tr>
    <tr><td>${t("billing.date")}</td><td>${new Date(order.createdAt).toLocaleString("ko-KR")}</td></tr>
  </table>
  <p class="footer">${COMPANY_INFO.companyName} · ${COMPANY_INFO.representative}<br/>${COMPANY_INFO.address}</p>
</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{COMPANY_INFO.serviceName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800">
            <dt className="text-slate-500">{t("billing.merchantUid")}</dt>
            <dd className="font-mono text-xs text-slate-800 dark:text-slate-100">
              {order.merchantUid || order.id}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800">
            <dt className="text-slate-500">{t("billing.plan")}</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{order.plan}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800">
            <dt className="text-slate-500">{t("billing.amount")}</dt>
            <dd className="font-semibold text-slate-900 dark:text-slate-50">
              ₩{order.amount.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800">
            <dt className="text-slate-500">{t("billing.status")}</dt>
            <dd className="text-slate-700 dark:text-slate-200">{order.status}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-slate-500">{t("billing.date")}</dt>
            <dd className="text-slate-700 dark:text-slate-200">
              {new Date(order.createdAt).toLocaleString("ko-KR")}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          {COMPANY_INFO.companyName} · {COMPANY_INFO.representative}
          <br />
          {COMPANY_INFO.contactEmail}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={printReceipt}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            {t("billing.print")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
          >
            {t("billing.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DataPanel() {
  const [usage, setUsage] = useState<{
    planId: string;
    usage: Record<string, { used: number; max: number | null; period?: string }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => setUsage(d))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">데이터 관리</h3>
        <p className="mt-1 text-xs text-slate-500">
          채팅 기록·서재 파일은 워크스페이스와 내 서재에서 관리합니다.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="font-medium text-slate-800 dark:text-slate-100">채팅 기록</p>
            <p className="mt-0.5 text-xs text-slate-500">
              사이드바 세션 목록에서 개별 삭제할 수 있습니다.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="font-medium text-slate-800 dark:text-slate-100">파일 · 서재</p>
            <p className="mt-0.5 text-xs text-slate-500">
              「내 서재」에서 업로드·삭제합니다. 팀 워크스페이스 설정에서도 파일 수를 확인할 수 있습니다.
            </p>
          </li>
        </ul>
      </section>
      {usage && (
        <section>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">사용량</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(usage.usage).map(([key, v]) => (
              <div
                key={key}
                className="rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700"
              >
                <p className="text-xs text-slate-500">{key}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {v.used}
                  {v.max != null ? ` / ${v.max}` : ""}
                  {v.period ? ` (${v.period})` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PlanPanel() {
  const { settings } = useSettings();
  const current = isPlanId(settings?.plan) ? settings!.plan : "free";

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        홈페이지 요금제와 동일한 구성입니다. 결제 완료 시 해당 요금제 권한이 계정에 자동 적용됩니다.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          const isCurrent = id === current;
          return (
            <div
              key={id}
              className={`flex flex-col rounded-2xl border p-5 ${
                isCurrent
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{p.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{p.description}</p>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50">
                {p.priceLabel}
                <span className="text-sm font-normal text-slate-500">{p.periodLabel}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-1.5">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                    {b}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button
                  type="button"
                  disabled
                  className="mt-5 w-full cursor-not-allowed rounded-xl bg-slate-200 py-2.5 text-sm font-semibold text-slate-500 dark:bg-slate-700"
                >
                  이용 중
                </button>
              ) : (
                <a
                  href={`/checkout?plan=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/20"
                >
                  결제하기
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Logo size="lg" />
      <p className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
        <span className="bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
          Z
        </span>
        eff{" "}
        <span className="text-blue-600 dark:text-blue-400">AI</span>
      </p>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        생각의 속도로 일하는 개인·팀 AI 워크스페이스
      </p>
      <p className="mt-8 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
        앱 버전 v1.0
      </p>
    </div>
  );
}
