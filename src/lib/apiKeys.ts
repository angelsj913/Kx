import { useSyncExternalStore } from "react";

export interface ApiKeys {
  gemini: string;
  openrouter: string;
}

const KEY = "ai-toolkit-api-keys";
const EMPTY: ApiKeys = { gemini: "", openrouter: "" };

let cache: ApiKeys | null = null;
const listeners = new Set<() => void>();

function read(): ApiKeys {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      gemini: typeof parsed?.gemini === "string" ? parsed.gemini : "",
      openrouter: typeof parsed?.openrouter === "string" ? parsed.openrouter : "",
    };
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): ApiKeys {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): ApiKeys {
  return EMPTY;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useApiKeys(): ApiKeys {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setApiKeys(keys: ApiKeys) {
  cache = keys;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(keys));
    } catch {
      /* ignore quota errors */
    }
  }
  listeners.forEach((l) => l());
}

/** 현재 저장된 키를 요청 헤더로 변환 (없으면 서버 환경변수로 폴백) */
export function keyHeaders(): Record<string, string> {
  const k = getSnapshot();
  const h: Record<string, string> = {};
  if (k.gemini) h["x-gemini-key"] = k.gemini;
  if (k.openrouter) h["x-openrouter-key"] = k.openrouter;
  return h;
}
