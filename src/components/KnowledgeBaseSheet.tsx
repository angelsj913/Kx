"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Upload, Trash2, MessageCircle, FileText, X, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useWorkspace, wsFetch } from "@/lib/workspaceClient";

interface LibraryItemSummary {
  id: string;
  title: string;
  fileName: string;
  createdAt: string;
  _count?: { chunks: number };
  /** 업로드 직후 optimistic row */
  pending?: boolean;
}

type LibraryTab = "mine" | "shared";

/** 채팅바 + 버튼 옆 팝업 — 전체 화면 library view 전환 없이 사용 */
export default function KnowledgeBaseSheet({
  open,
  onClose,
  onOpenBookChat,
}: {
  open: boolean;
  onClose: () => void;
  onOpenBookChat: (sessionId: string) => void;
}) {
  const t = useT();
  const { activeId } = useWorkspace();
  const [tab, setTab] = useState<LibraryTab>("mine");
  const [items, setItems] = useState<LibraryItemSummary[]>([]);
  const [usage, setUsage] = useState<{ used: number; max: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cacheRef = useRef<Record<string, LibraryItemSummary[]>>({});

  const sharedReady = !!activeId && activeId !== "personal";

  async function refetch(force = false) {
    const cacheKey = tab;
    if (!force && cacheRef.current[cacheKey]?.length) {
      setItems(cacheRef.current[cacheKey]!);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res =
        tab === "mine"
          ? await fetch("/api/library?scope=personal", { headers: { "X-Workspace-Id": "personal" } })
          : await wsFetch("/api/library?scope=shared");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("library.errors.loadFailed"));
      const list = (data.items ?? []) as LibraryItemSummary[];
      cacheRef.current[cacheKey] = list;
      setItems(list);
      if (data.usage) setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unknownError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    if (tab === "shared" && !sharedReady) {
      setItems([]);
      return;
    }
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, sharedReady]);

  function indexLabel(item: LibraryItemSummary) {
    if (item.pending || reindexingId === item.id) return t("library.index.pending");
    const chunks = item._count?.chunks ?? 0;
    return chunks > 0 ? t("library.index.ready") : t("library.index.failed");
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setUploading(true);
    setError("");

    const tempId = `temp-${Date.now()}`;
    const optimistic: LibraryItemSummary = {
      id: tempId,
      title: file.name.replace(/\.[^.]+$/, ""),
      fileName: file.name,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    cacheRef.current[tab] = [optimistic, ...(cacheRef.current[tab] ?? [])];
    setItems(cacheRef.current[tab]!);

    try {
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(`library/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/library/blob-upload",
      });
      const init: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        }),
      };
      const res =
        tab === "mine"
          ? await fetch("/api/library?scope=personal", {
              ...init,
              headers: { ...init.headers, "X-Workspace-Id": "personal" },
            })
          : await wsFetch("/api/library?scope=shared", init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data?.code as string | undefined;
        if (code === "LIBRARY_QUOTA") {
          throw new Error(data?.error ?? t("library.limitReached"));
        }
        if (code === "NEED_WORKSPACE") {
          throw new Error(data?.error ?? t("library.needWorkspace"));
        }
        throw new Error(data?.error ?? t("library.errors.uploadFailed"));
      }
      const saved = {
        ...(data.item as LibraryItemSummary),
        _count: data.indexed ? { chunks: 1 } : { chunks: 0 },
      };
      cacheRef.current[tab] = [
        saved,
        ...(cacheRef.current[tab]?.filter((i) => i.id !== tempId) ?? []),
      ];
      setItems(cacheRef.current[tab]!);
      if (data.usage) setUsage(data.usage);
    } catch (err) {
      cacheRef.current[tab] = cacheRef.current[tab]?.filter((i) => i.id !== tempId) ?? [];
      setItems(cacheRef.current[tab]!);
      setError(err instanceof Error ? err.message : t("common.unknownError"));
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    cacheRef.current[tab] = cacheRef.current[tab]?.filter((i) => i.id !== id) ?? [];
    if (tab === "mine") {
      await fetch(`/api/library/${id}`, { method: "DELETE", headers: { "X-Workspace-Id": "personal" } });
    } else {
      await wsFetch(`/api/library/${id}`, { method: "DELETE" });
    }
  }

  async function onReindex(id: string) {
    setReindexingId(id);
    setError("");
    try {
      const res = await fetch("/api/rag/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libraryItemId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("library.errors.uploadFailed"));
      cacheRef.current[tab] =
        cacheRef.current[tab]?.map((item) =>
          item.id === id ? { ...item, _count: { chunks: Math.max(1, item._count?.chunks ?? 0) } } : item,
        ) ?? [];
      setItems([...(cacheRef.current[tab] ?? [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unknownError"));
    } finally {
      setReindexingId(null);
    }
  }

  async function onBookChat(id: string) {
    const res =
      tab === "mine"
        ? await fetch(`/api/library/${id}/chat`, { method: "POST", headers: { "X-Workspace-Id": "personal" } })
        : await wsFetch(`/api/library/${id}/chat`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.sessionId) {
      onOpenBookChat(data.sessionId);
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="absolute bottom-full left-0 z-30 mb-2 flex max-h-[min(24rem,70vh)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl max-md:fixed max-md:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] max-md:left-3 max-md:right-3 max-md:w-auto dark:border-slate-700 dark:bg-slate-900/95"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-blue-600" />
              {t("sidebar.myLibrary")}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void refetch(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={t("library.reindex")}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-slate-200 p-2 dark:border-slate-800">
            {(["mine", "shared"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${tab === key ? "bg-blue-600/10 text-blue-700 dark:text-blue-300" : "text-slate-500"}`}
              >
                {key === "mine" ? t("library.tab.mine") : t("library.tab.shared")}
              </button>
            ))}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onPickFile} className="hidden" />
            <button
              type="button"
              disabled={uploading || (tab === "shared" && !sharedReady)}
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              title={t("library.upload")}
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>

          {usage && tab === "mine" && (
            <p className="px-3 py-1 text-[10px] text-slate-400">
              {usage.used}/{usage.max}
            </p>
          )}
          {error && <p className="px-3 py-2 text-xs text-red-500">{error}</p>}

          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {items.length === 0 && !loading && (
              <li className="py-8 text-center text-xs text-slate-400">{t("library.empty")}</li>
            )}
            {items.map((item) => {
              const indexed = (item._count?.chunks ?? 0) > 0;
              return (
                <li key={item.id} className="mb-2 rounded-xl border border-slate-200 p-2.5 dark:border-slate-800">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{item.title}</p>
                      <p className="truncate text-[10px] text-slate-400">{item.fileName}</p>
                      <p
                        className={`mt-1 text-[10px] font-medium ${
                          indexed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {indexLabel(item)}
                      </p>
                    </div>
                    <button type="button" onClick={() => void onDelete(item.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void onBookChat(item.id)}
                      disabled={item.pending}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-blue-500/30 bg-blue-600/10 py-1.5 text-[11px] font-semibold text-blue-700 disabled:opacity-50 dark:text-blue-300"
                    >
                      <MessageCircle className="h-3 w-3" />
                      {t("library.bookChat")}
                    </button>
                    {!indexed && !item.pending && (
                      <button
                        type="button"
                        onClick={() => void onReindex(item.id)}
                        disabled={reindexingId === item.id}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                      >
                        {t("library.reindex")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
