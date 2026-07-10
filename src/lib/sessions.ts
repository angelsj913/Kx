import { useCallback, useEffect, useState } from "react";

export interface SessionSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch("/api/chat/sessions");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "라이브러리를 불러오지 못했습니다.");
  return data.sessions ?? [];
}

/** 사이드바 "라이브러리" 목록 상태. 세션 생성/갱신 후 refetch()로 다시 최신순 정렬해 반영한다. */
export function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setSessions(await fetchSessions());
    } catch {
      /* 목록 갱신 실패는 조용히 무시 — 다음 refetch에서 다시 시도됨 */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await fetchSessions();
        if (!ignore) setSessions(data);
      } catch {
        /* 목록 갱신 실패는 조용히 무시 — 다음 refetch에서 다시 시도됨 */
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const removeSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
  }, []);

  return { sessions, loading, refetch, removeSession };
}
