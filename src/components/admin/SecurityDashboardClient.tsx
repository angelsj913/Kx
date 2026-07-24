"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Play, RefreshCw, Shield } from "lucide-react";

type Finding = {
  id: string;
  checkId: string;
  severity: string;
  domain?: string | null;
  title: string;
  detail: string;
  remediation?: string | null;
  result: string;
  status: string;
  skillIds: string[];
};

const DOMAIN_LABELS: Record<string, string> = {
  http: "HTTP·브라우저 하드닝",
  secrets: "시크릿·민감정보",
  "access-control": "접근제어·멀티테넌트",
  "rate-limit": "레이트리밋",
  jwt: "JWT·세션",
  deps: "의존성·공급망",
  auth: "인증",
  env: "환경·시크릿 설정",
};
const DOMAIN_ORDER = ["secrets", "access-control", "auth", "http", "jwt", "rate-limit", "deps", "env"];

function domainOf(f: Finding): string {
  return f.domain || f.checkId.split(".")[0] || "auth";
}

type Overview = {
  score: number | null;
  lastScanAt: string | null;
  lastScanId: string | null;
  openBySeverity: Record<string, number>;
  recentFindings: Finding[];
  twoFaAdoption: number;
};

const SEV_CLASS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
};

export default function SecurityDashboardClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/security/overview");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "불러오지 못했습니다.");
      setData(json as Overview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runScan() {
    setScanning(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/security/scan", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "스캔 실패");
      setNotice(`스캔 완료 · 점수 ${json.scan?.score ?? "—"}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "스캔 실패");
    } finally {
      setScanning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        불러오는 중…
      </div>
    );
  }

  const open = data?.openBySeverity ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Shield className="h-5 w-5 text-blue-600" />
            보안 프로그램
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            관리자 전용 · 스킬 기반 체크리스트 스캔 (읽기 전용)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/security/findings"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Finding 전체
          </Link>
          <Link
            href="/admin/security/skills"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            스킬 카탈로그
          </Link>
          <Link
            href="/admin/security/agent"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            보안 에이전트
          </Link>
          <Link
            href="/admin/security/settings"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            설정
          </Link>
          <button
            type="button"
            onClick={() => void runScan()}
            disabled={scanning}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            지금 스캔
          </button>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            새로고침
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {notice}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="보안 점수" value={data?.score == null ? "—" : String(data.score)} />
        <Stat
          label="Open Critical / High"
          value={`${open.critical ?? 0} / ${open.high ?? 0}`}
        />
        <Stat
          label="Open Med / Low"
          value={`${open.medium ?? 0} / ${open.low ?? 0}`}
        />
        <Stat label="2FA 사용률" value={`${data?.twoFaAdoption ?? 0}%`} />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        최근 스캔:{" "}
        {data?.lastScanAt
          ? new Date(data.lastScanAt).toLocaleString()
          : "아직 없음"}
        {data?.lastScanId ? (
          <>
            {" · "}
            <Link
              href={`/admin/security/scans/${data.lastScanId}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              상세 보기
            </Link>
            {" · "}
            <a
              href={`/api/admin/security/scans/${data.lastScanId}/export?format=md`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              리포트(MD)
            </a>
          </>
        ) : null}
      </p>

      <FindingsByDomain findings={data?.recentFindings ?? []} />
    </div>
  );
}

function FindingsByDomain({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        스캔을 실행하면 결과가 도메인별로 여기에 표시됩니다.
      </div>
    );
  }

  const groups = new Map<string, Finding[]>();
  for (const f of findings) {
    const d = domainOf(f);
    (groups.get(d) ?? groups.set(d, []).get(d)!).push(f);
  }
  const orderedDomains = [
    ...DOMAIN_ORDER.filter((d) => groups.has(d)),
    ...[...groups.keys()].filter((d) => !DOMAIN_ORDER.includes(d)),
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">도메인별 최근 Finding</div>
      {orderedDomains.map((domain) => {
        const items = groups.get(domain)!;
        const open = items.filter((f) => f.status !== "resolved" && f.result !== "pass").length;
        return (
          <div
            key={domain}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-800">
              <span>{DOMAIN_LABELS[domain] ?? domain}</span>
              <span className="text-xs font-normal text-slate-500">
                {items.length}건{open > 0 ? ` · open ${open}` : ""}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">심각도</th>
                    <th className="px-4 py-2 font-medium">결과</th>
                    <th className="px-4 py-2 font-medium">제목</th>
                    <th className="px-4 py-2 font-medium">상태</th>
                    <th className="px-4 py-2 font-medium">checkId</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEV_CLASS[f.severity] ?? SEV_CLASS.low}`}
                        >
                          {f.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{f.result}</td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{f.title}</div>
                        <div className="mt-0.5 max-w-md truncate text-xs text-slate-500">
                          {f.detail}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs">{f.status}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-500">{f.checkId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
