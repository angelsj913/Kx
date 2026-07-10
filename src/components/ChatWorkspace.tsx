"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  User,
  FileText,
  ImageIcon,
  Plus,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import { QUICK_TOOLS, isQuickToolEnabled } from "@/lib/quickTools";
import type { ToolDef } from "@/lib/tools";
import type { StructuredKind } from "@/lib/structured";
import FileResultPanel from "./FileResultPanel";
import StructuredResultView from "./structured/StructuredResultView";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface StoredAttachment {
  url: string;
  filename: string;
  mimeType: string;
}

interface PendingFile {
  file: File;
  previewUrl: string;
}

interface Msg {
  id: string;
  role: "user" | "model";
  text: string;
  attachments?: StoredAttachment[] | null;
  outputType?: string;
  structuredKind?: string | null;
  resultData?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
}

interface StreamEvent {
  type: "status" | "done" | "error";
  sessionId: string;
  key?: string;
  message?: Msg | string;
}

export default function ChatWorkspace({
  sessionId,
  onSessionCreated,
  onTurnSaved,
}: {
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
  onTurnSaved: () => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeQuickTool, setActiveQuickTool] = useState<ToolDef | null>(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  useEffect(() => {
    // page.tsx가 activeSessionId를 key로 써서 세션이 바뀔 때마다 이 컴포넌트를 통째로 리마운트시키므로,
    // sessionId는 마운트 동안 고정값이다 — null이면 이 이펙트는 아무 것도 하지 않고 messages는 초기값(빈 배열)을 유지한다.
    if (!sessionId) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}`);
        const data = await res.json();
        if (!ignore && res.ok) {
          setMessages(
            (data.session.history ?? []).map((m: Msg) => ({ ...m }))
          );
        }
      } catch {
        // 무시: 히스토리 로딩 실패는 치명적이지 않음
      }
    })();
    return () => {
      ignore = true;
    };
  }, [sessionId]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const added: PendingFile[] = [];
    for (const f of files) {
      if (f.size > 12 * 1024 * 1024) {
        setError(`${f.name}: 파일이 너무 큽니다 (최대 12MB).`);
        continue;
      }
      added.push({ file: f, previewUrl: URL.createObjectURL(f) });
    }
    setPending((p) => [...p, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if ((!text && pending.length === 0) || loading) return;

    setError("");
    setLoading(true);
    setStatusKey("status.agent.selecting");

    const optimisticFiles: StoredAttachment[] = pending.map((p) => ({
      url: p.previewUrl,
      filename: p.file.name,
      mimeType: p.file.type || "application/octet-stream",
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: "user",
        text,
        attachments: optimisticFiles.length ? optimisticFiles : undefined,
      },
    ]);

    const filesToUpload = pending.map((p) => p.file);
    const quickToolId = activeQuickTool?.id ?? null;
    setDraft("");
    setPending([]);
    setActiveQuickTool(null);

    try {
      const form = new FormData();
      form.append("text", text);
      if (sessionId) form.append("sessionId", sessionId);
      if (quickToolId) form.append("quickToolId", quickToolId);
      for (const f of filesToUpload) form.append("files", f);

      const res = await fetch("/api/chat", { method: "POST", body: form });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "요청에 실패했습니다.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let newSessionId: string | null = null;
      let doneMessage: Msg | null = null;
      let errorMessage: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          newSessionId = event.sessionId ?? newSessionId;
          if (event.type === "status") setStatusKey(event.key ?? null);
          else if (event.type === "done") doneMessage = event.message as Msg;
          else if (event.type === "error") errorMessage = event.message as string;
        }
      }

      if (errorMessage) throw new Error(errorMessage);
      if (!sessionId && newSessionId) onSessionCreated(newSessionId);
      if (doneMessage) setMessages((prev) => [...prev, doneMessage as Msg]);
      onTurnSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setStatusKey(null);
    }
  }

  const enabledQuickTools = settings?.enabledQuickTools ?? [];
  const officeTools = QUICK_TOOLS.filter(
    (tool) => tool.appMode === "office" && isQuickToolEnabled(enabledQuickTools, tool.id)
  );
  const studentTools = QUICK_TOOLS.filter(
    (tool) => tool.appMode === "student" && isQuickToolEnabled(enabledQuickTools, tool.id)
  );

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col px-4 py-4 sm:px-6">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-xl shadow-black/30 backdrop-blur-md sm:p-5"
      >
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <p className="max-w-sm text-sm text-slate-400">{t("chat.empty")}</p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end gap-2.5">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-violet-900/30">
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {m.attachments.map((f, j) => (
                      <a
                        key={j}
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[11px] hover:bg-white/25"
                      >
                        {f.mimeType.startsWith("image/") ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        {f.filename}
                      </a>
                    ))}
                  </div>
                )}
                {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
              </div>
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/60">
                <User className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              {m.outputType === "pptx" || m.outputType === "xlsx" ? (
                <div className="min-w-0 flex-1">
                  <FileResultPanel
                    outputType={m.outputType}
                    deck={m.outputType === "pptx" && m.resultData ? JSON.parse(m.resultData) : undefined}
                    workbook={m.outputType === "xlsx" && m.resultData ? JSON.parse(m.resultData) : undefined}
                    file={
                      m.fileUrl && m.fileName
                        ? {
                            url: m.fileUrl,
                            filename: m.fileName,
                            mimeType: m.outputType === "pptx" ? PPTX_MIME : XLSX_MIME,
                          }
                        : undefined
                    }
                  />
                  <p className="mt-2 text-sm text-slate-300">{m.text}</p>
                </div>
              ) : m.outputType === "structured" && m.structuredKind && m.resultData ? (
                <div className="min-w-0 flex-1">
                  <StructuredResultView
                    key={m.id}
                    id={m.id}
                    kind={m.structuredKind as StructuredKind}
                    data={JSON.parse(m.resultData)}
                  />
                  <p className="mt-2 text-sm text-slate-300">{m.text}</p>
                </div>
              ) : (
                <div className="prose-ai max-w-[80%] rounded-2xl rounded-tl-sm border border-slate-700/50 bg-slate-900/50 px-4 py-2.5 text-sm">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              )}
            </div>
          )
        )}

        {loading && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 [animation-delay:300ms]" />
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
        className="relative mt-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-3 shadow-xl shadow-black/30 backdrop-blur-md"
      >
        <div className="mb-1.5 flex h-4 items-center px-1">
          <AnimatePresence mode="wait">
            {statusKey && (
              <motion.span
                key={statusKey}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="text-[11px] font-medium text-violet-300"
              >
                {t(statusKey as Parameters<typeof t>[0])}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {activeQuickTool && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-600/15 px-2.5 py-1 text-xs text-violet-200">
              <activeQuickTool.icon className="h-3.5 w-3.5" />
              {activeQuickTool.short}
              <button
                type="button"
                onClick={() => setActiveQuickTool(null)}
                className="text-violet-300 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pending.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300"
              >
                {p.file.type.startsWith("image/") ? (
                  <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-violet-400" />
                )}
                <span className="max-w-[10rem] truncate">{p.file.name}</span>
                <button
                  type="button"
                  onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                  className="text-slate-500 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="relative shrink-0">
            <motion.button
              type="button"
              onClick={() => setQuickActionsOpen((v) => !v)}
              disabled={loading}
              whileTap={{ scale: 0.96 }}
              title={t("chat.quickActions")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/60 text-slate-400 transition-colors hover:border-violet-500/50 hover:text-violet-300 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
            </motion.button>

            <AnimatePresence>
              {quickActionsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute bottom-full left-0 mb-2 w-56 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-md"
                >
                  <QuickToolGroup
                    label={t("chat.quickActions.office")}
                    tools={officeTools}
                    onSelect={(tool) => {
                      setActiveQuickTool(tool);
                      setQuickActionsOpen(false);
                    }}
                  />
                  <QuickToolGroup
                    label={t("chat.quickActions.student")}
                    tools={studentTools}
                    onSelect={(tool) => {
                      setActiveQuickTool(tool);
                      setQuickActionsOpen(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            title={t("chat.attach")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/60 text-slate-400 transition-colors hover:border-violet-500/50 hover:text-violet-300 disabled:opacity-50"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={onPickFiles}
            className="hidden"
          />
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
            placeholder={activeQuickTool ? activeQuickTool.placeholder : t("chat.placeholder")}
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={loading || (!draft.trim() && pending.length === 0)}
            title={t("chat.send")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}

function QuickToolGroup({
  label,
  tools,
  onSelect,
}: {
  label: string;
  tools: ToolDef[];
  onSelect: (tool: ToolDef) => void;
}) {
  const t = useT();
  if (tools.length === 0) return null;
  return (
    <div className="border-b border-slate-800/60 p-2 last:border-b-0">
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelect(tool)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/60"
          >
            <Icon className="h-4 w-4 text-violet-400" />
            {t(`quicktool.${tool.id}.label` as Parameters<typeof t>[0])}
          </button>
        );
      })}
    </div>
  );
}
