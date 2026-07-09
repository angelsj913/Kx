"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  User,
  FileText,
  ImageIcon,
} from "lucide-react";
import ModelSelect from "@/components/ModelSelect";
import { DEFAULT_MODEL } from "@/lib/models";
import { PERSONAS, DEFAULT_PERSONA } from "@/lib/personas";
import { keyHeaders } from "@/lib/apiKeys";

interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64 (no prefix)
}

interface Msg {
  role: "user" | "model";
  text: string;
  files?: Attachment[];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [personaId, setPersonaId] = useState(DEFAULT_PERSONA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const added: Attachment[] = [];
    for (const f of files) {
      if (f.size > 12 * 1024 * 1024) {
        setError(`${f.name}: 파일이 너무 큽니다 (최대 12MB).`);
        continue;
      }
      added.push({
        name: f.name,
        mimeType: f.type || "application/octet-stream",
        data: await fileToBase64(f),
      });
    }
    setPending((p) => [...p, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if ((!text && pending.length === 0) || loading) return;

    const userMsg: Msg = { role: "user", text, files: pending.length ? pending : undefined };
    const history = [...messages, userMsg];
    setMessages(history);
    setDraft("");
    setPending([]);
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...keyHeaders() },
        body: JSON.stringify({
          model,
          personaId,
          messages: history.map((m) => ({
            role: m.role,
            text: m.text,
            files: m.files?.map((f) => ({ data: f.data, mimeType: f.mimeType })),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "요청에 실패했습니다.");
      setMessages((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      {/* 헤더: 페르소나 + 모델 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-3 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {PERSONAS.map((p) => {
            const active = p.id === personaId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersonaId(p.id)}
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
        <ModelSelect model={model} onChange={setModel} disabled={loading} />
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
              이미지나 문서를 첨부할 수도 있어요.
            </p>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end gap-2.5">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-violet-900/30">
                {m.files && m.files.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {m.files.map((f, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[11px]"
                      >
                        {f.mimeType.startsWith("image/") ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        {f.name}
                      </span>
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
            <div key={i} className="flex gap-2.5">
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
            {pending.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300"
              >
                {f.mimeType.startsWith("image/") ? (
                  <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-violet-400" />
                )}
                <span className="max-w-[10rem] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setPending((p) => p.filter((_, j) => j !== i))}
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
  );
}
