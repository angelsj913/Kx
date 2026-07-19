"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Upload, Trash2, MessageCircle, FileText, Users } from "lucide-react";
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

type LibraryTab = "mine" | "shared";

export default function LibraryView({
  onOpenBookChat,
}: {
  onOpenBookChat: (sessionId: string) => void;
}) {
  const t = useT();
  const { activeId, workspaces } = useWorkspace();
  const [tab, setTab] = useState<LibraryTab>("mine");
  const [items, setItems] = useState<LibraryItemSummary[]>([]);
  const [usage, setUsage] = useState<{ used: number; max: number; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const hasTeamWorkspace = (workspaces?.length ?? 0) > 0;
  const sharedReady = !!activeId && activeId !== "personal";

  async function refetch() {
    setLoading(true);
    try {
      // 내 서재: 항상 개인 스코프. 공유 서재: 활성 팀 워크스페이스.
      const headers: HeadersInit = {};
      if (tab === "mine") {
        headers["X-Workspace-Id"] = "personal";
      }
      // shared: wsFetch가 활성 워크스페이스 헤더를 붙임
      const res =
        tab === "mine"
          ? await fetch("/api/library?scope=personal", {
              headers: { ...headers },
            })
          : await wsFetch("/api/library?scope=shared");
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        if (data.usage) setUsage(data.usage);
      } else {
        setError(data?.error ?? t("library.errors.loadFailed"));
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setError("");
    if (tab === "shared" && !sharedReady) {
      setItems([]);
      setUsage(null);
      setLoading(false);
      return;
    }
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, tab]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      // 1) 파일을 Blob으로 직접 업로드 — 서버리스 4.5MB 본문 한도(413 "Request Entity Too
      //    Large")를 우회한다. 예전엔 FormData로 함수에 통째 보내다 큰 파일에서 깨졌다.
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(`library/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/library/blob-upload",
      });
      // 2) 메타데이터(작은 JSON)만 서버로 보내 서재 항목 생성·색인.
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
      if (!res.ok) throw new Error(data?.error ?? t("library.errors.uploadFailed"));
      setItems((prev) => [data.item, ...prev]);
      if (data.usage) setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unknownError"));
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm(t("library.deleteConfirm"))) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (tab === "mine") {
      await fetch(`/api/library/${id}`, {
        method: "DELETE",
        headers: { "X-Workspace-Id": "personal" },
      });
    } else {
      await wsFetch(`/api/library/${id}`, { method: "DELETE" });
    }
  }

  async function onBookChat(id: string) {
    const res =
      tab === "mine"
        ? await fetch(`/api/library/${id}/chat`, {
            method: "POST",
            headers: { "X-Workspace-Id": "personal" },
          })
        : await wsFetch(`/api/library/${id}/chat`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.sessionId) onOpenBookChat(data.sessionId);
  }

  const title = tab === "mine" ? t("library.title") : t("library.sharedTitle");
  const subtitle = tab === "mine" ? t("library.subtitle") : t("library.sharedSubtitle");
  const emptyText =
    tab === "shared" && !sharedReady
      ? t("library.needWorkspace")
      : tab === "shared"
        ? t("library.sharedEmpty")
        : t("library.empty");

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col overflow-y-auto px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
            {tab === "shared" ? (
              <Users className="h-5 w-5 text-[var(--mode-accent)]" />
            ) : (
              <BookOpen className="h-5 w-5 text-[var(--mode-accent)]" />
            )}
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          {usage && tab === "mine" && (
            <p className="mt-1 text-xs text-slate-400">
              {t("library.usagePrefix")}{usage.used} / {usage.max}{t("library.usageSuffix")}
              {usage.used >= usage.max ? t("library.limitReached") : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "mine"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              {t("library.tab.mine")}
            </button>
            <button
              type="button"
              onClick={() => setTab("shared")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "shared"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              {t("library.tab.shared")}
            </button>
          </div>
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
            disabled={
              uploading ||
              (tab === "mine" && !!usage && usage.used >= usage.max) ||
              (tab === "shared" && !sharedReady)
            }
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {uploading ? t("library.uploading") : t("library.upload")}
          </motion.button>
        </div>
      </div>

      {tab === "shared" && !sharedReady && hasTeamWorkspace && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          {t("library.needWorkspace")}
        </p>
      )}

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
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
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
