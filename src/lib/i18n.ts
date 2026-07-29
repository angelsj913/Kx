"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { type AppLanguage } from "./languages";
import {
  getLanguage,
  getServerLanguage,
  setLanguage,
  subscribeLanguage,
} from "./languageStore";
import { KO, type AppDictKey } from "./i18nKeys";
import { EN } from "./i18n/en";

export type { AppLanguage, AppDictKey };

type Dict = Record<string, string>;

const KO_DICT: Dict = KO as unknown as Dict;
const EN_DICT: Dict = EN as unknown as Dict;

const cache: Partial<Record<AppLanguage, Dict>> = {
  ko: KO_DICT,
  en: EN_DICT,
};

const lazyLoaders: Partial<Record<AppLanguage, () => Promise<{ default: unknown }>>> = {
  ja: () => import("./i18n/ja"),
  zh: () => import("./i18n/zh"),
  ru: () => import("./i18n/ru"),
  de: () => import("./i18n/de"),
  fr: () => import("./i18n/fr"),
  es: () => import("./i18n/es"),
  ar: () => import("./i18n/ar"),
};

const inflight = new Map<AppLanguage, Promise<void>>();
let cacheVersion = 0;
const cacheListeners = new Set<() => void>();

function bumpCache() {
  cacheVersion += 1;
  cacheListeners.forEach((l) => l());
}

function subscribeCache(cb: () => void) {
  cacheListeners.add(cb);
  return () => {
    cacheListeners.delete(cb);
  };
}

function getCacheVersion() {
  return cacheVersion;
}

async function ensureLocale(lang: AppLanguage): Promise<void> {
  if (cache[lang]) return;
  const existing = inflight.get(lang);
  if (existing) return existing;

  const loader = lazyLoaders[lang];
  if (!loader) return;

  const task = loader()
    .then((mod) => {
      if (lang === "ar") {
        cache.ar = { ...EN_DICT, ...(mod.default as Dict) };
      } else {
        cache[lang] = mod.default as Dict;
      }
      bumpCache();
    })
    .catch((err) => {
      console.error(`[i18n] failed to load locale ${lang}`, err);
    })
    .finally(() => {
      inflight.delete(lang);
    });

  inflight.set(lang, task);
  return task;
}

function resolveDict(lang: AppLanguage): Dict {
  return cache[lang] ?? EN_DICT;
}

/** Prefetch a locale chunk (e.g. after user picks a language in settings). */
export function prefetchAppLocale(lang: AppLanguage) {
  void ensureLocale(lang);
}

/** 서버(UserSettings) 반영이 끝난 뒤에만 호출해서 전역 언어를 실제로 갈아입힌다.
 *  앱·랜딩·결제창이 모두 languageStore 하나를 공유하므로 어디서든 즉시 반영된다. */
export function setAppLanguage(lang: AppLanguage) {
  prefetchAppLocale(lang);
  setLanguage(lang);
}

export function useAppLanguage(): AppLanguage {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);
}

export function useT() {
  const language = useAppLanguage();
  useSyncExternalStore(subscribeCache, getCacheVersion, () => 0);

  useEffect(() => {
    void ensureLocale(language);
  }, [language]);

  return useCallback(
    (key: AppDictKey) => {
      const dict = resolveDict(language);
      return dict[key] ?? EN_DICT[key] ?? KO_DICT[key] ?? key;
    },
    [language],
  );
}

/** 퀵툴 라벨 — 번역 키 누락 시 tool.label 폴백 (`.label` 키 노출 방지) */
export function toolUiLabel(
  tool: { id: string; label: string; short?: string },
  t: (key: AppDictKey) => string,
): string {
  const key = `quicktool.${tool.id}.label` as AppDictKey;
  const translated = t(key);
  if (
    !translated ||
    translated === key ||
    translated.endsWith(".label") ||
    translated.startsWith("quicktool.")
  ) {
    return tool.label || tool.short || tool.id;
  }
  return translated;
}

export function featureGroupLabel(
  groupId: string,
  fallback: string,
  t: (key: AppDictKey) => string,
): string {
  const map: Record<string, AppDictKey> = {
    create: "feature.create",
    learn: "feature.learn",
    media: "feature.media",
  };
  const key = map[groupId];
  if (!key) return fallback;
  return t(key);
}
