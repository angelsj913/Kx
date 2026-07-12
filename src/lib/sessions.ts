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

  return { sessions, loading, refetch, removeSession };
}
