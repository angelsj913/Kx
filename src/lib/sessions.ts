"use client";

import { useCallback, useEffect, useState } from "react";

export interface SessionSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  createdAt: string;
}

async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch("/api/chat/sessions");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "라이브러리를 불러오지 못했습니다.");
  return data.sessions ?? [];
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setSessions(await fetchSessions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const removeSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
  }, []);

  return { sessions, loading, refetch, removeSession };
}
