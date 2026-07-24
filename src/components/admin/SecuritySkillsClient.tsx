"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import SecurityBackLink from "./SecurityBackLink";

type Skill = {
  id: string;
  title: string;
  description: string;
  domain: string | null;
  tags: string[];
  checkIds: string[];
};

export default function SecuritySkillsClient() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (tag) p.set("tag", tag);
    if (domain) p.set("domain", domain);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [q, tag, domain]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/security/skills${queryString}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "불러오기 실패");
      setSkills(json.skills ?? []);
      setTags(json.meta?.tags ?? []);
      setDomains(json.meta?.domains ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <SecurityBackLink />
        <h1 className="text-xl font-bold">보안 스킬 카탈로그</h1>
        <p className="mt-1 text-sm text-slate-500">
          큐레이션된 방어 스킬만 표시합니다. 전체 {total}개 · 관리자 전용
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색 (이름, 설명, 태그)"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">도메인 전체</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">태그 전체</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          불러오는 중…
        </div>
      ) : skills.length === 0 ? (
        <p className="text-sm text-slate-500">
          스킬이 없습니다. 설정에서 「스킬 매니페스트 동기화」를 실행해 보세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {skills.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">{s.id}</p>
                </div>
                {s.domain && (
                  <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    {s.domain}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{s.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {s.checkIds.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  연결 체크:{" "}
                  {s.checkIds.map((c) => (
                    <code key={c} className="mr-1 rounded bg-slate-100 px-1 dark:bg-slate-800">
                      {c}
                    </code>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
