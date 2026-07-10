"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, User, Paperclip, Plus, X, FileText, ImageIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { QUICK_TOOLS, type QuickTool } from "@/lib/quickTools";

interface Turn {
  id: string;
  message: string;
  reply: string;
  createdAt: string;
}

interface StreamStatus {
  key: string;
  agentId?: string;
}

export default function ChatWorkspace({
  sessionId,
  enabledQuickTools,
  onSessionCreated,
  onTurnSaved,
}: {
  sessionId: string | null;
  enabledQuickTools: Record<string, boolean> | null;
  onSessionCreated: (id: string) => void;
  onTurnSaved: () => void;
}) {
  const t = useT();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [pendingUserMsg, setPendingUserMsg] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  // sessionId가 바뀐 순간(렌더 중) 이전 세션의 대화를 즉시 비운다 — 이렇게 하면
  // fetch가 끝나기 전까지 화면에 이전 세션의 메시지가 잠깐 남아있는 걸 막을 수 있다.
  const [prevSessionId, setPrevSessionId] = useState(sessionId);
  if (sessionId !== prevSessionId) {
    setPrevSessionId(sessionId);
    if (!sessionId) setTurns([]);
  }

  // 세션 전환 시 해당 대화 이력을 불러온다. sessionId가 null이면 새 채팅(빈 화면).
  useEffect(() => {
    if (!sessionId) return;
    let ignore = false;
    (async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}`);
        const data = await res.json();
        if (!ignore && res.ok) setTurns(data.history ?? []);
      } catch {
        /* 무시: 목록에서 다시 선택하면 재시도됨 */
      } finally {
        if (!ignore) setLoadingHistory(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns.length, pendingUserMsg, status]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    }
    if (toolsOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [toolsOpen]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePendingFile(i: number) {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function applyQuickTool(tool: QuickTool) {
    setDraft(tool.promptTemplate);
    setToolsOpen(false);
    textareaRef.current?.focus();
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const message = draft.trim();
    if ((!message && pendingFiles.length === 0) || sending) return;

    setError("");
    setSending(true);
    setPendingUserMsg(message || "(첨부 파일)");
    setDraft("");
    const files = pendingFiles;
    setPendingFiles([]);
    setStatus({ key: "analyzing" });

    try {
      let res: Response;
      if (files.length > 0) {
        const form = new FormData();
        form.append("message", message);
        if (sessionId) form.append("sessionId", sessionId);
        for (const f of files) form.append("files", f);
        res = await fetch("/api/chat", { method: "POST", body: form });
      } else {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, sessionId }),
        });
      }

      if (!res.body) throw new Error("스트리밍 응답을 받지 못했습니다.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "status") {
            setStatus({ key: event.key, agentId: event.agentId });
          } else if (event.type === "error") {
            setError(event.key ? t(`error.${event.key}`) : event.message || "오류가 발생했습니다.");
          } else if (event.type === "done") {
            setTurns((prev) => [...prev, { id: event.id, message: event.message, reply: event.reply, createdAt: event.createdAt }]);
            if (!sessionId) onSessionCreated(event.sessionId);
            onTurnSaved();
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSending(false);
      setStatus(null);
      setPendingUserMsg(null);
    }
  }

  const officeTools = QUICK_TOOLS.filter((qt) => qt.group === "office" && enabledQuickTools?.[qt.id] !== false);
  const studentTools = QUICK_TOOLS.filter((qt) => qt.group === "student" && enabledQuickTools?.[qt.id] !== false);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-1 py-6">
        {!loadingHistory && turns.length === 0 && !pendingUserMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">{t("chat.emptyTitle")}</h2>
            <p className="max-w-sm text-sm text-slate-400">{t("chat.emptyDesc")}</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {turns.map((turn) => (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-3"
            >
              <div className="flex justify-end">
                <div className="flex max-w-[80%] items-start gap-2.5">
                  <p className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-slate-800/70 px-4 py-2.5 text-sm text-slate-100">
                    {turn.message}
                  </p>
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/60">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="prose-ai min-w-0 max-w-[85%] text-sm text-slate-200">
                  <ReactMarkdown>{turn.reply}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {pendingUserMsg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex justify-end">
              <div className="flex max-w-[80%] items-start gap-2.5">
                <p className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-slate-800/70 px-4 py-2.5 text-sm text-slate-100">
                  {pendingUserMsg}
                </p>
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/60">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">{error}</p>
        )}
      </div>

      <form onSubmit={send} className="mt-2 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-3 shadow-xl shadow-black/30 backdrop-blur-md transition-colors duration-200 focus-within:border-violet-500/40">
        <div className="min-h-[1.1rem] px-1">
          <AnimatePresence mode="wait">
            {status && (
              <motion.p
                key={status.key + (status.agentId ?? "")}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.18 }}
                className="text-[11px] font-medium text-violet-300"
              >
                {t(`status.${status.key}`, status.agentId ? { agent: t(`agent.${status.agentId}`) } : undefined)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {pendingFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 px-1">
            {pendingFiles.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300"
              >
                {f.type.startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5 text-violet-400" /> : <FileText className="h-3.5 w-3.5 text-violet-400" />}
                <span className="max-w-[10rem] truncate">{f.name}</span>
                <button type="button" onClick={() => removePendingFile(i)} className="text-slate-500 hover:text-red-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div ref={toolsRef} className="relative">
            <AnimatePresence>
              {toolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-2 w-56 origin-bottom-left overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md"
                >
                  <ToolGroup label={t("chat.groupOffice")} tools={officeTools} onPick={applyQuickTool} t={t} />
                  <div className="border-t border-slate-800/60" />
                  <ToolGroup label={t("chat.groupStudent")} tools={studentTools} onPick={applyQuickTool} t={t} />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              title={t("chat.addTools")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/60 text-slate-400 transition-colors duration-200 hover:border-violet-500/50 hover:text-violet-300"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={t("chat.attach")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/60 text-slate-400 transition-colors duration-200 hover:border-violet-500/50 hover:text-violet-300"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf,.doc,.docx,.txt" onChange={onPickFiles} className="hidden" />

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={t("chat.placeholder")}
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
          />
          <button
            type="submit"
            disabled={sending || (!draft.trim() && pendingFiles.length === 0)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ToolGroup({
  label,
  tools,
  onPick,
  t,
}: {
  label: string;
  tools: QuickTool[];
  onPick: (tool: QuickTool) => void;
  t: (key: string) => string;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="py-1.5">
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onPick(tool)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-200 transition-colors duration-150 hover:bg-slate-800/60"
          >
            <Icon className="h-4 w-4 shrink-0 text-violet-400" />
            {t(tool.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
