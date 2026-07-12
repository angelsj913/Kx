"use client";

import type { SaveStatus } from "@/lib/useAutosave";

export default function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "error") {
    return <span className="text-xs font-medium text-red-500 dark:text-red-400">저장 실패</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--mode-accent)]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--mode-accent)]" />
      저장 중...
    </span>
  );
}
