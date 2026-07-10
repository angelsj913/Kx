"use client";

import { useState, type FormEvent } from "react";

type Provider = "gemini" | "groq" | "openrouter";

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
  { id: "openrouter", label: "OpenRouter" },
];

// /api/chat 뼈대 라우트를 눈으로 확인해보기 위한 개발용 테스트 페이지.
// 프로덕션 빌드에서는 /api/chat 자체가 404를 반환하므로 이 화면도 실질적으로 동작하지 않는다.
export default function ApiTestPage() {
  const [provider, setProvider] = useState<Provider>("gemini");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setError("");
    setReply("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "요청에 실패했습니다.");
      setReply(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-bold">/api/chat 테스트</h1>
        <p className="mt-1 text-sm text-slate-400">
          프로바이더를 바꿔가며 같은 메시지에 대한 응답을 비교해보세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="flex gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  provider === p.id
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="테스트할 메시지를 입력하세요"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-violet-500"
          />

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "생성 중..." : "전송"}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
          {loading && <p className="text-slate-500">AI 응답을 기다리는 중입니다...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {!loading && !error && reply && (
            <p className="whitespace-pre-wrap text-slate-200">{reply}</p>
          )}
          {!loading && !error && !reply && (
            <p className="text-slate-600">여기에 응답이 표시됩니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
