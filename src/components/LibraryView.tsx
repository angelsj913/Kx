"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Upload, Trash2, MessageCircle, FileText } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useWorkspace, wsFetch } from "@/lib/workspaceClient";

interface LibraryItemSummary {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

export default function LibraryView({
  onOpenBookChat,
}: {
  onOpenBookChat: (sessionId: string) => void;
}) {
  const t = useT();
  const { activeId } = useWorkspace();
  const [items, setItems] = useState<LibraryItemSummary[]>([]);
  const [usage, setUsage] = useState<{ used: number; max: number; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function refetch() {
    try {
      const res = await wsFetch("/api/library");
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        if (data.usage) setUsage(data.usage);
      }
    } finally {
      setLoading(false);
    }
  }

  // 활성 워크스페이스가 바뀌면 해당 스코프의 서재로 다시 불러온다.
  useEffect(() => {
    refetch();
  }, [activeId]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await wsFetch("/api/library", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "업로드에 실패했습니다.");
      setItems((prev) => [data.item, ...prev]);
      if (data.usage) setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm(t("library.deleteConfirm"))) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await wsFetch(`/api/library/${id}`, { method: "DELETE" });
  }

  async function onBookChat(id: string) {
    const res = await wsFetch(`/api/library/${id}/chat`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.sessionId) onOpenBookChat(data.sessionId);
  }

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col overflow-y-auto px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
            <BookOpen className="h-5 w-5 text-[var(--mode-accent)]" />
            {t("library.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("library.subtitle")}</p>
          {usage && (
            <p className="mt-1 text-xs text-slate-400">
              저장 {usage.used} / {usage.max}개
              {usage.used >= usage.max ? " · 한도 도달" : ""}
            </p>
          )}
        </div>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={onPickFile}
            className="hidden"
          />
          <motion.button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || (!!usage && usage.used >= usage.max)}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {uploading ? t("library.uploading") : t("library.upload")}
          </motion.button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 shadow-lg shadow-blue-600/30">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{t("library.empty")}</p>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-blue-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-lg dark:shadow-black/20 dark:backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-500/15">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                aria-label={t("library.delete")}
                className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-3 truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={item.title}>
              {item.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">{item.fileName}</p>

            <button
              type="button"
              onClick={() => onBookChat(item.id)}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-600/10 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white dark:bg-blue-500/10 dark:text-blue-300"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {t("library.bookChat")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
