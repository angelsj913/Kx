"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  User,
  FileText,
  ImageIcon,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeft,
} from "lucide-react";
import { PERSONAS, DEFAULT_PERSONA } from "@/lib/personas";

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
  attachments?: StoredAttachment[];
}

interface ConversationSummary {
  id: string;
  personaId: string;
  title: string | null;
  updatedAt: string;
}

export default function AiChat() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [personaId, setPersonaId] = useState(DEFAULT_PERSONA);
  const [loading, setLoading] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations ?? []);
    } catch {
      // 무시: 목록 갱신 실패는 치명적이지 않음
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/chat/conversations");
        const data = await res.json();
        if (!ignore && res.ok) setConversations(data.conversations ?? []);
      } catch {
        // 무시: 목록 갱신 실패는 치명적이지 않음
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function openConversation(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "대화를 불러오지 못했습니다.");
      const c = data.conversation;
      setConversationId(c.id);
      setPersonaId(c.personaId);
      setMessages(
        (c.messages ?? []).map(
          (m: { id: string; role: string; text: string; attachments: unknown }) => ({
            id: m.id,
            role: m.role === "model" ? "model" : "user",
            text: m.text,
            attachments: (m.attachments as StoredAttachment[] | null) ?? undefined,
          })
        )
      );
      setListOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  }

  function startNewConversation(nextPersonaId?: string) {
    setConversationId(null);
    setMessages([]);
    setError("");
    if (nextPersonaId) setPersonaId(nextPersonaId);
    setListOpen(false);
  }

  async function removeConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === conversationId) startNewConversation();
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
  }

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

    const optimisticFiles: StoredAttachment[] = pending.map((p) => ({
      url: p.previewUrl,
      filename: p.file.name,
      mimeType: p.file.type || "application/octet-stream",
    }));
    const optimisticMsg: Msg = {
      id: `local-${Date.now()}`,
      role: "user",
      text,
      attachments: optimisticFiles.length ? optimisticFiles : undefined,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    const filesToUpload = pending.map((p) => p.file);
    setDraft("");
    setPending([]);

    try {
      let convId = conversationId;
      if (!convId) {
        const res = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "대화를 시작하지 못했습니다.");
        convId = data.conversation.id;
        setConversationId(convId);
      }

      const form = new FormData();
      form.append("text", text);
      for (const f of filesToUpload) form.append("files", f);

      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "요청에 실패했습니다.");

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticMsg.id);
        return [
          ...withoutOptimistic,
          {
            id: data.userMessage.id,
            role: "user",
            text: data.userMessage.text,
            attachments: data.userMessage.attachments ?? undefined,
          },
          {
            id: data.assistantMessage.id,
            role: "model",
            text: data.assistantMessage.text,
          },
        ];
      });
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  return (
    <div className="mx-auto flex h-full max-w-5xl gap-4">
      {/* 대화 목록 (데스크톱: 항상 표시, 모바일: 토글) */}
      <aside
        className={`${
          listOpen ? "flex" : "hidden"
        } w-64 shrink-0 flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-xl shadow-black/30 backdrop-blur-md lg:flex`}
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 p-3">
          <h2 className="text-xs font-semibold text-slate-400">대화 목록</h2>
          <button
            type="button"
            onClick={() => startNewConversation()}
            title="새 대화"
            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-1 text-[11px] font-semibold text-white shadow-md shadow-violet-900/30"
          >
            <Plus className="h-3 w-3" />새 대화
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-slate-600">
              아직 대화가 없어요.
            </li>
          )}
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => openConversation(c.id)}
                className={`group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  c.id === conversationId
                    ? "bg-violet-600/20 ring-1 ring-violet-500/40"
                    : "hover:bg-slate-800/60"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                  <span className="truncate text-xs text-slate-300">
                    {c.title || "새 대화"}
                  </span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeConversation(c.id, e)}
                  className="shrink-0 text-slate-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 헤더: 페르소나 + 목록 토글 */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-3 shadow-xl shadow-black/30 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setListOpen((v) => !v)}
              title="대화 목록"
              className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 lg:hidden"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            {PERSONAS.map((p) => {
              const active = p.id === personaId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (p.id !== personaId) startNewConversation(p.id);
                  }}
                  title={p.tagline}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 메시지 목록 */}
        <div
          ref={scrollRef}
          className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-xl shadow-black/30 backdrop-blur-md sm:p-5"
        >
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm text-slate-400">
                <span className="font-medium text-slate-200">{persona.name}</span>
                에게 무엇이든 물어보세요.
                <br />
                이미지나 문서를 첨부할 수도 있어요. 이 대화는 로그인한 계정에
                자동 저장되어 다른 기기에서도 이어갈 수 있어요.
              </p>
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
                <div className="prose-ai max-w-[80%] rounded-2xl rounded-tl-sm border border-slate-700/50 bg-slate-900/50 px-4 py-2.5 text-sm">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
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

        {/* 입력 */}
        <form
          onSubmit={send}
          className="mt-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-3 shadow-xl shadow-black/30 backdrop-blur-md"
        >
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
                    onClick={() =>
                      setPending((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-slate-500 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              title="이미지·문서 첨부"
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
              placeholder="무엇이든 물어보세요...  (Enter 전송 · Shift+Enter 줄바꿈)"
              className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              type="submit"
              disabled={loading || (!draft.trim() && pending.length === 0)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.05] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
