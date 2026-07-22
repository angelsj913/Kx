"use client";

import { useCallback, useEffect, useState } from "react";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

type BackupRecord = {
  id: string;
  status: string;
  trigger: string;
  fileName: string | null;
  sizeBytes: string | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  adminEmail: string | null;
};

type BackupStatus = {
  records: BackupRecord[];
  nextScheduledAt: string | null;
  scheduleIntervalHours: number;
};

declare global {
  interface Window {
    zeffBackup?: {
      listDrives: () => Promise<Array<{ path: string; label: string }>>;
      setTargetPath: (path: string) => Promise<void>;
      getTargetPath: () => Promise<string | null>;
      runScheduledCheck: () => Promise<{ ok: boolean; message: string }>;
      writeBackupFile: (fileName: string, base64: string) => Promise<string>;
      getLastRunAt: () => Promise<string | null>;
    };
  }
}

export default function SecurityBackupPage() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [drives, setDrives] = useState<Array<{ path: string; label: string }>>([]);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const isElectron = typeof window !== "undefined" && !!window.zeffBackup;

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/backup/status");
    if (res.ok) setStatus(await res.json());
    if (window.zeffBackup) {
      setTargetPath(await window.zeffBackup.getTargetPath());
      setDrives(await window.zeffBackup.listDrives());
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function startBackup(trigger: "manual" | "scheduled" = "manual") {
    if (!password || password.length < 8) {
      setMessage("백업 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/backup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, trigger }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "백업 실패");
        return;
      }

      if (isElectron && window.zeffBackup && data.fileName && data.encryptedBase64) {
        const saved = await window.zeffBackup.writeBackupFile(data.fileName, data.encryptedBase64);
        setMessage(`Electron HDD 저장 완료: ${saved}`);
      } else if (data.downloadUrl) {
        window.location.href = data.downloadUrl;
        setMessage("암호화 백업 다운로드가 시작됩니다.");
      } else {
        setMessage("백업이 완료되었습니다.");
      }
      await refresh();
    } catch (err) {
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function selectDrive(path: string) {
    if (!window.zeffBackup) return;
    await window.zeffBackup.setTargetPath(path);
    setTargetPath(path);
    setMessage(`백업 대상: ${path}`);
  }

  return (
    <SecurityPageShell
      title="백업"
      description="AES-256-GCM 암호화 · Electron 48시간 자동 백업"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">수동 백업</h2>
          <p className="mt-2 text-xs text-slate-500">
            비밀번호는 서버에 저장되지 않습니다. 분실 시 복구 불가.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="백업 암호 (8자+)"
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => startBackup("manual")}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "백업 중…" : "지금 백업"}
          </button>
          {message && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{message}</p>}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Electron HDD</h2>
          {isElectron ? (
            <>
              <p className="mt-2 text-xs text-green-600">데스크톱 클라이언트 연결됨</p>
              <p className="mt-1 text-xs text-slate-500">대상: {targetPath ?? "미설정"}</p>
              <ul className="mt-3 space-y-1 text-xs">
                {drives.map((d) => (
                  <li key={d.path}>
                    <button
                      type="button"
                      onClick={() => selectDrive(d.path)}
                      className="text-left text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {d.label} — {d.path}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                48시간마다 자동 백업 (세션·HDD·비밀번호 설정 시)
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              HDD 자동 백업은 ZEFF AI Electron 앱에서만 사용할 수 있습니다.
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">
          백업 이력
          {status?.nextScheduledAt && (
            <span className="ml-2 font-normal text-slate-500">
              · 다음 예정: {new Date(status.nextScheduledAt).toLocaleString("ko-KR")}
            </span>
          )}
        </h2>
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950">
            <tr>
              <th className="px-3 py-2">시작</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">트리거</th>
              <th className="px-3 py-2">파일</th>
              <th className="px-3 py-2">크기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(status?.records ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">{new Date(r.startedAt).toLocaleString("ko-KR")}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">{r.trigger}</td>
                <td className="px-3 py-2">{r.fileName ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">
                  {r.sizeBytes ? `${Math.round(Number(r.sizeBytes) / 1024)} KB` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </SecurityPageShell>
  );
}
