"use client";

import { useEffect, useRef, useState } from "react";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

type LiveEvent = {
  type: "login" | "audit";
  at: string;
  summary: string;
};

export default function SecurityLivePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/admin/security/live");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as LiveEvent | LiveEvent[];
        if (Array.isArray(data)) {
          setEvents(data.slice(-50));
        } else {
          setEvents((prev) => [...prev.slice(-49), data]);
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [events]);

  return (
    <SecurityPageShell title="실시간 활동" description="SSE 로그인·감사 이벤트">
      <p className="mb-3 text-xs text-slate-500">
        연결: {connected ? "● live" : "○ reconnecting…"}
      </p>
      <div
        ref={listRef}
        className="h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-green-400 dark:border-slate-800"
      >
        {events.length === 0 && <p className="text-slate-500">이벤트 대기 중…</p>}
        {events.map((e, i) => (
          <div key={`${e.at}-${i}`} className="mb-1">
            <span className="text-slate-500">[{new Date(e.at).toLocaleTimeString("ko-KR")}]</span>{" "}
            <span className={e.type === "login" ? "text-blue-400" : "text-amber-400"}>{e.type}</span>{" "}
            {e.summary}
          </div>
        ))}
      </div>
    </SecurityPageShell>
  );
}
