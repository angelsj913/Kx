"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import SecurityBackLink from "./SecurityBackLink";

type Settings = {
  notifyOnCritical: boolean;
  enabledChecks: string[];
  availableChecks: string[];
  updatedAt?: string;
};

export default function SecuritySettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/security/settings");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "불러오기 실패");
      setSettings(json.settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/security/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyOnCritical: settings.notifyOnCritical,
          enabledChecks: settings.enabledChecks,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "저장 실패");
      setSettings(json.settings);
      setNotice("설정을 저장했습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  async function syncSkills() {
    setSyncing(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/security/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-skills" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "동기화 실패");
      setNotice(`스킬 매니페스트 ${json.synced}개 동기화 완료`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setSyncing(false);
    }
  }

  function toggleCheck(id: string) {
    if (!settings) return;
    const set = new Set(settings.enabledChecks);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    // empty = all checks (engine default); keep explicit list when user toggles
    setSettings({ ...settings, enabledChecks: [...set] });
  }

  function enableAll() {
    if (!settings) return;
    setSettings({ ...settings, enabledChecks: [...settings.availableChecks] });
  }

  function clearAll() {
    if (!settings) return;
    setSettings({ ...settings, enabledChecks: [] });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        불러오는 중…
      </div>
    );
  }

  if (!settings) {
    return <p className="text-sm text-red-600">{error || "설정을 불러올 수 없습니다."}</p>;
  }

  const enabledSet = new Set(settings.enabledChecks);
  const allMode = settings.enabledChecks.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <SecurityBackLink />
        <h1 className="text-xl font-bold">보안 프로그램 설정</h1>
        <p className="mt-1 text-sm text-slate-500">관리자만 변경할 수 있습니다.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.notifyOnCritical}
          onChange={(e) =>
            setSettings({ ...settings, notifyOnCritical: e.target.checked })
          }
        />
        Critical 실패 시 알림 플래그 (스캔 summary에 기록)
      </label>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">활성화할 체크</h2>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={enableAll} className="text-blue-600 hover:underline">
              전부 선택
            </button>
            <button type="button" onClick={clearAll} className="text-blue-600 hover:underline">
              비우기 (기본=전부 실행)
            </button>
          </div>
        </div>
        {allMode && (
          <p className="mb-2 text-xs text-slate-500">
            목록이 비어 있으면 스캔 시 기본 체크 전체를 실행합니다.
          </p>
        )}
        <ul className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          {settings.availableChecks.map((id) => (
            <li key={id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allMode || enabledSet.has(id)}
                  onChange={() => {
                    if (allMode) {
                      setSettings({
                        ...settings,
                        enabledChecks: settings.availableChecks.filter((x) => x !== id),
                      });
                    } else {
                      toggleCheck(id);
                    }
                  }}
                />
                <span className="font-mono text-xs">{id}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          disabled={syncing}
          onClick={() => void syncSkills()}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
        >
          {syncing ? "동기화 중…" : "스킬 매니페스트 동기화"}
        </button>
      </div>
    </div>
  );
}
