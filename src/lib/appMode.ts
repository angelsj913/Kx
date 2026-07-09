import { useSyncExternalStore } from "react";
import type { AppMode } from "./tools";

const KEY = "ai-toolkit-app-mode";
const DEFAULT: AppMode = "office";

let cache: AppMode | null = null;
const listeners = new Set<() => void>();

function read(): AppMode {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "student" || raw === "office" ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function getSnapshot(): AppMode {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): AppMode {
  return DEFAULT;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAppMode(): AppMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setAppMode(mode: AppMode) {
  cache = mode;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, mode);
    } catch {
      /* ignore quota errors */
    }
  }
  listeners.forEach((l) => l());
}
