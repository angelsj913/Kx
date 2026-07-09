import { useSyncExternalStore } from "react";
import type { OutputType } from "./tools";

export interface HistoryItem {
  id: string;
  /** 도구 레지스트리의 tool id */
  toolId: string;
  /** 표시용으로 저장해 두는 도구 라벨 (도구가 바뀌어도 안전) */
  toolLabel: string;
  outputType: OutputType;
  prompt: string;
  /** 마크다운 결과 또는 pptx/xlsx용 원본 JSON 문자열 */
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
    if (!Array.isArray(parsed)) return [];
    // 예전 형식({mode})으로 저장된 항목도 깨지지 않게 보정
    return parsed.map((item): HistoryItem => ({
      id: String(item?.id ?? Date.now()),
      toolId: item?.toolId ?? item?.mode ?? "unknown",
      toolLabel: item?.toolLabel ?? item?.mode ?? "이전 기록",
      outputType: item?.outputType ?? "markdown",
      prompt: typeof item?.prompt === "string" ? item.prompt : "",
      result: typeof item?.result === "string" ? item.result : "",
      createdAt: typeof item?.createdAt === "number" ? item.createdAt : Date.now(),
    }));
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
