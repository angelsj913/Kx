"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Send, Shield } from "lucide-react";
import SecurityBackLink from "./SecurityBackLink";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "최근 스캔 점수와 열린 Finding을 요약해줘",
  "OTP / 세션 관련 체크가 어떤 상태야?",
  "testing-api-authentication-weaknesses 스킬 요약해줘",
];

export default function SecurityAgentClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;

    setError("");
    setMeta("");
    const nextHistory = [...messages, { role: "user" as const, content: message }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/security/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "요청 실패");

      const reply = String(json.reply ?? "");
      setMessages([...nextHistory, { role: "assistant", content: reply }]);
      const tools = Array.isArray(json.toolsUsed) ? json.toolsUsed.join(", ") : "";
      const bits = [
        json.refused ? "거절됨" : null,
        tools ? `도구: ${tools}` : null,
        json.provider ? `${json.provider}/${json.model}` : null,
      ].filter(Boolean);
      setMeta(bits.join(" · "));
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="flex h-[min(720px,calc(100vh-8rem))] flex-col gap-4">
      <div>
        <SecurityBackLink />
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Shield className="h-5 w-5 text-blue-600" />
          보안 에이전트
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          스캔·Finding·큐레이션 스킬만 근거로 답합니다. 공격/해킹 요청은 거절합니다.
        </p>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">질문을 입력하거나 위 예시를 눌러 보세요.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            분석 중…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {meta && !error && <p className="text-xs text-slate-400">{meta}</p>}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 최근 critical Finding 설명해줘"
          disabled={loading}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          전송
        </button>
      </form>
    </div>
  );
}
