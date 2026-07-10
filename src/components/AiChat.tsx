"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, User } from "lucide-react";
import type { ChatHistoryItem } from "@/lib/chatHistory";

/** 사용자에게는 단 하나의 AI와 대화하는 화면만 보인다 — 어떤 모델이 답했는지는
 * 절대 노출하지 않는다(백엔드 릴레이 파이프라인은 src/app/api/chat/route.ts 참고). */
export default function AiChat({
  items,
  prepend,
}: {
  items: ChatHistoryItem[];
  prepend: (item: ChatHistoryItem) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<{ message: string } | null>(null);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const transcript = [...items].reverse();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [transcript.length, pending]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const message = draft.trim();
    if (!message || pending) return;

    setError("");
    setDraft("");
    setPending({ message });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "요청에 실패했습니다.");

      prepend({
        id: data.id,
        message: data.message,
        reply: data.reply,
        provider: data.provider,
        model: data.model,
        createdAt: data.createdAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-xl shadow-black/30 backdrop-blur-md sm:p-5"
      >
        {transcript.length === 0 && !pending && (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <p className="text-sm text-slate-400">
              zeff에게 무엇이든 물어보세요.
              <br />
              대화는 로그인한 계정에 자동 저장되어 히스토리에서 다시 볼 수 있어요.
            </p>
          </div>
        )}

        {transcript.map((item) => (
          <div key={item.id} className="space-y-3">
            <div className="flex justify-end gap-2.5">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-violet-900/30">
                <p className="whitespace-pre-wrap">{item.message}</p>
              </div>
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/60">
                <User className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="prose-ai max-w-[80%] rounded-2xl rounded-tl-sm border border-slate-700/50 bg-slate-900/50 px-4 py-2.5 text-sm">
                <ReactMarkdown>{item.reply}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {pending && (
          <div className="space-y-3">
            <div className="flex justify-end gap-2.5">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-violet-900/30">
                <p className="whitespace-pre-wrap">{pending.message}</p>
              </div>
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/60">
                <User className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-700/50 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                생성 중...
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      <form
        onSubmit={send}
        className="mt-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-3 shadow-xl shadow-black/30 backdrop-blur-md"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="무엇이든 물어보세요...  (Enter 전송 · Shift+Enter 줄바꿈)"
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
          />
          <button
            type="submit"
            disabled={!!pending || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.05] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
