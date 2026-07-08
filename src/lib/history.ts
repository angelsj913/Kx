import { useSyncExternalStore } from "react";

export type ToolMode = "business" | "interview";

export interface HistoryItem {
  id: string;
  mode: ToolMode;
  prompt: string;
  result: string;
  createdAt: number;
}

const KEY = "ai-toolkit-history";
const MAX_ITEMS = 100;

const EMPTY: HistoryItem[] = [];
let cache: HistoryItem[] | null = null;
const listeners = new Set<() => void>();

function read(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: HistoryItem[]) {
  cache = items.slice(0, MAX_ITEMS);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      /* ignore quota errors */
    }
  }
  listeners.forEach((l) => l());
}

function getSnapshot(): HistoryItem[] {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): HistoryItem[] {
  return EMPTY;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useHistory(): HistoryItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addHistoryItem(item: HistoryItem) {
  write([item, ...getSnapshot()]);
}

export function removeHistoryItem(id: string) {
  write(getSnapshot().filter((i) => i.id !== id));
}

export function clearHistory() {
  write([]);
}
