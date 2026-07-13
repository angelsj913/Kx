"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkspace, wsFetch } from "@/lib/workspaceClient";

export interface SessionSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  createdAt: string;
}

async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await wsFetch("/api/chat/sessions");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "라이브러리를 불러오지 못했습니다.");
  return data.sessions ?? [];
}

/** 빈 세션을 서버에 만들고 요약 객체 반환 */
export async function createEmptySession(title = "새 대화"): Promise<SessionSummary> {
  const res = await wsFetch("/api/chat/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "대화를 만들지 못했습니다.");
  return data.session as SessionSummary;
}

export function useSessions() {
  const { activeId, loading: workspaceLoading } = useWorkspace();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const list = await fetchSessions();
      setSessions(list);
      return list;
    } finally {
      setLoading(false);
    }
  }, []);

  // 워크스페이스 스코프가 준비된 뒤에만 목록 로드 (헤더 레이스 방지)
  useEffect(() => {
    if (workspaceLoading) return;
    setLoading(true);
    void refetch();
  }, [refetch, activeId, workspaceLoading]);

  const removeSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await wsFetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
  }, []);

  /**
   * 새 대화 생성.
   * 낙관적 UI: API 응답 전에 라이브러리에 「새 대화」를 먼저 띄운다.
   */
  const createSession = useCallback(async (title = "새 대화") => {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic: SessionSummary = {
      id: tempId,
      title,
      createdAt: now,
      updatedAt: now,
    };
    setSessions((prev) => [optimistic, ...prev.filter((s) => s.id !== tempId)]);

    try {
      const session = await createEmptySession(title);
      setSessions((prev) => {
        const withoutTemp = prev.filter((s) => s.id !== tempId && s.id !== session.id);
        return [session, ...withoutTemp];
      });
      return session;
    } catch (err) {
      setSessions((prev) => prev.filter((s) => s.id !== tempId));
      throw err;
    }
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
    refetch,
    removeSession,
    createSession,
    upsertSession,
  };
}
