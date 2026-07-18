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
/** 접속 국가로 정한 "기본" 언어(사용자가 직접 고른 값이 아님) — 미들웨어가 심는다. */
const GEO_COOKIE = "zeff-geo-lang";
export const LANGUAGE_DEFAULT: AppLanguage = "ko";

let cache: AppLanguage | null = null;
const listeners = new Set<() => void>();

function isAppLanguage(v: string | null): v is AppLanguage {
  return !!v && (LANGUAGE_ORDER as string[]).includes(v);
}

/** 사용자가 명시적으로 언어를 고른 적이 있는지(localStorage에 값이 있는지). */
export function hasStoredLanguage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return STORAGE_KEYS.some((key) => isAppLanguage(window.localStorage.getItem(key)));
  } catch {
    return false;
  }
}

/** 접속 국가 기반 기본 언어(미들웨어가 심은 쿠키). 명시적 선택이 없을 때만 참고. */
function readGeoDefault(): AppLanguage | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)zeff-geo-lang=([^;]+)/);
  const v = m ? decodeURIComponent(m[1]) : null;
  return isAppLanguage(v) ? v : null;
}

function readFromStorage(): AppLanguage {
  if (typeof window === "undefined") return LANGUAGE_DEFAULT;
  try {
    // 1) 사용자가 직접 고른 값(가장 우선)
    for (const key of STORAGE_KEYS) {
      const v = window.localStorage.getItem(key);
      if (isAppLanguage(v)) return v;
    }
  } catch {
    /* ignore */
  }
  // 2) 명시적 선택이 없으면 접속 국가 기본값(#15), 그것도 없으면 한국어
  return readGeoDefault() ?? LANGUAGE_DEFAULT;
}

/** GEO_COOKIE 를 참조하는 미들웨어와 이름을 공유하기 위한 export. */
export { GEO_COOKIE };

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
