"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkspace, wsFetch } from "@/lib/workspaceClient";

export interface SessionSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  createdAt: string;
  /** 메시지 수 (있으면 실제 대화, 0이면 빈 새 대화) */
  messageCount?: number;
}

async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await wsFetch("/api/chat/sessions");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "라이브러리를 불러오지 못했습니다.");
  return (data.sessions ?? []) as SessionSummary[];
}

export async function createEmptySession(title = "새 대화"): Promise<SessionSummary> {
  const res = await wsFetch("/api/chat/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "대화를 만들지 못했습니다.");
  return { ...(data.session as SessionSummary), messageCount: 0 };
}

export function useSessions() {
  const { activeId, loading: workspaceLoading } = useWorkspace();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchSessions();
      setSessions(list);
      return list;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "목록을 불러오지 못했습니다.";
      setError(msg);
      console.error("[sessions]", msg);
      return [] as SessionSummary[];
    } finally {
      setLoading(false);
    }
  }, []);

  // 워크스페이스 준비 후 즉시 이전 대화 목록 로드
  useEffect(() => {
    if (workspaceLoading) return;
    setLoading(true);
    void refetch();
  }, [refetch, activeId, workspaceLoading]);

  const removeSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await wsFetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
  }, []);

  /** 「새 대화」 버튼 전용 — 입장 시 자동 호출하지 않음 */
  const createSession = useCallback(async (title = "새 대화") => {
    const session = await createEmptySession(title);
    setSessions((prev) => {
      const rest = prev.filter((s) => s.id !== session.id);
      // 빈 새 대화는 목록 맨 위(최근)
      return [session, ...rest];
    });
    return session;
  }, []);

  const upsertSession = useCallback((session: SessionSummary) => {
    setSessions((prev) => {
      const rest = prev.filter((s) => s.id !== session.id);
      return [session, ...rest];
    });
  }, []);

  return {
    sessions,
    loading: loading || workspaceLoading,
    error,
    refetch,
    removeSession,
    createSession,
    upsertSession,
  };
}
