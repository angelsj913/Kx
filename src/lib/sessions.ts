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
  const { activeId } = useWorkspace();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setSessions(await fetchSessions());
    } finally {
      setLoading(false);
    }
  }, []);

  // 활성 워크스페이스가 바뀌면 해당 스코프의 목록으로 다시 불러온다.
  useEffect(() => {
    refetch();
  }, [refetch, activeId]);

  const removeSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await wsFetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
  }, []);

  /** 새 대화를 만들고 목록 맨 위에 즉시 반영 */
  const createSession = useCallback(async (title = "새 대화") => {
    const session = await createEmptySession(title);
    setSessions((prev) => {
      if (prev.some((s) => s.id === session.id)) return prev;
      return [session, ...prev];
    });
    return session;
  }, []);

  /** 목록에 없거나 제목이 바뀐 세션을 낙관적으로 반영 */
  const upsertSession = useCallback((session: SessionSummary) => {
    setSessions((prev) => {
      const rest = prev.filter((s) => s.id !== session.id);
      return [session, ...rest];
    });
  }, []);

  return { sessions, loading, refetch, removeSession, createSession, upsertSession };
}
