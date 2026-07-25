"use client";

import { useCallback, useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { wsFetch } from "@/lib/workspaceClient";

interface Props {
  chatHistoryId: string;
  sessionId?: string | null;
  toolId?: string | null;
  disabled?: boolean;
}

export default function AnswerFeedbackButtons({
  chatHistoryId,
  sessionId,
  toolId,
  disabled,
}: Props) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [busy, setBusy] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await wsFetch(`/api/feedback?ids=${encodeURIComponent(chatHistoryId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          feedbacks: { chatHistoryId: string; rating: number }[];
        };
        const hit = data.feedbacks.find((f) => f.chatHistoryId === chatHistoryId);
        if (!cancelled && hit) setRating(hit.rating === 1 ? 1 : -1);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatHistoryId]);

  const submit = useCallback(
    async (nextRating: 1 | -1, nextReason?: string) => {
      if (busy || disabled) return;
      setBusy(true);
      try {
        const res = await wsFetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatHistoryId,
            sessionId,
            toolId,
            rating: nextRating,
            reason: nextReason ?? null,
          }),
        });
        if (res.ok) {
          setRating(nextRating);
          if (nextRating === -1 && !nextReason) setShowReason(true);
          else setShowReason(false);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, chatHistoryId, disabled, sessionId, toolId],
  );

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={busy || disabled}
          onClick={() => void submit(1)}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            rating === 1
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
          }`}
          title="도움이 됐어요"
        >
          <ThumbsUp className="h-3 w-3" />
          좋아요
        </button>
        <button
          type="button"
          disabled={busy || disabled}
          onClick={() => void submit(-1)}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            rating === -1
              ? "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              : "border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
          }`}
          title="아쉬워요"
        >
          <ThumbsDown className="h-3 w-3" />
          아쉬워요
        </button>
      </div>
      {showReason && rating === -1 && (
        <div className="flex flex-wrap gap-1.5">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="어떤 점이 아쉬웠나요? (선택)"
            className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] dark:border-slate-600 dark:bg-slate-900"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit(-1, reason.trim() || undefined)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium dark:border-slate-600 dark:bg-slate-900"
          >
            전송
          </button>
        </div>
      )}
    </div>
  );
}
