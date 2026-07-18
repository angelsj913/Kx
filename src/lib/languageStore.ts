"use client";

import { LANGUAGE_ORDER, type AppLanguage } from "./languages";

/**
 * 앱(i18n)과 랜딩(landingI18n)이 각자 별도 캐시·리스너를 갖고 있어, 워크스페이스에서
 * 언어를 바꿔도 랜딩으로 SPA 이동하면 옛 캐시(한국어)가 남아 있던 버그가 있었다.
 * 두 시스템이 이 단일 저장소를 공유해 어디서 바꾸든 전역에 즉시 전파되게 한다.
 *
 * localStorage 키는 과거 호환을 위해 두 개(app/landing)를 함께 쓰지만, 메모리 캐시와
 * 리스너는 하나다.
 */

const STORAGE_KEYS = ["zeff-app-language", "zeff-landing-language"] as const;
export const LANGUAGE_DEFAULT: AppLanguage = "ko";

let cache: AppLanguage | null = null;
const listeners = new Set<() => void>();

function isAppLanguage(v: string | null): v is AppLanguage {
  return !!v && (LANGUAGE_ORDER as string[]).includes(v);
}

function readFromStorage(): AppLanguage {
  if (typeof window === "undefined") return LANGUAGE_DEFAULT;
  try {
    for (const key of STORAGE_KEYS) {
      const v = window.localStorage.getItem(key);
      if (isAppLanguage(v)) return v;
    }
  } catch {
    /* ignore */
  }
  return LANGUAGE_DEFAULT;
}

// 다른 탭에서 언어가 바뀌면 이 탭도 따라간다.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key && (STORAGE_KEYS as readonly string[]).includes(e.key)) {
      const next = readFromStorage();
      if (next !== cache) {
        cache = next;
        listeners.forEach((l) => l());
      }
    }
  });
}

export function getLanguage(): AppLanguage {
  if (cache === null) cache = readFromStorage();
  return cache;
}

export function getServerLanguage(): AppLanguage {
  return LANGUAGE_DEFAULT;
}

export function setLanguage(lang: AppLanguage): void {
  cache = lang;
  if (typeof window !== "undefined") {
    for (const key of STORAGE_KEYS) {
      try {
        window.localStorage.setItem(key, lang);
      } catch {
        /* ignore quota errors */
      }
    }
  }
  listeners.forEach((l) => l());
}

export function subscribeLanguage(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
