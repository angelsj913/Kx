"use client";

import { useCallback, useSyncExternalStore } from "react";
import ko from "./ko";
import en from "./en";
import ja from "./ja";
import zh from "./zh";
import ru from "./ru";
import de from "./de";
import fr from "./fr";
import es from "./es";

import {
  LANGUAGE_LABELS,
  LANGUAGE_ORDER,
  type AppLanguage,
} from "../languages";

export type LandingLanguage = AppLanguage;
export { LANGUAGE_LABELS, LANGUAGE_ORDER };

const STORAGE_KEY = "zeff-landing-language";
const DEFAULT_LANGUAGE: LandingLanguage = "ko";

const DICT: Record<LandingLanguage, Record<keyof typeof ko, string>> = { ko, en, ja, zh, ru, de, fr, es };

let cache: LandingLanguage | null = null;
const listeners = new Set<() => void>();

function isLandingLanguage(v: string | null): v is LandingLanguage {
  return !!v && LANGUAGE_ORDER.includes(v as LandingLanguage);
}

function read(): LandingLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isLandingLanguage(raw) ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function getSnapshot(): LandingLanguage {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): LandingLanguage {
  return DEFAULT_LANGUAGE;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setLandingLanguage(lang: LandingLanguage) {
  cache = lang;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore quota errors */
    }
  }
  listeners.forEach((l) => l());
}

export function useLandingLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { language, setLanguage: setLandingLanguage };
}

export type LandingDictKey = keyof typeof ko;

export function useLandingT() {
  const { language } = useLandingLanguage();
  return useCallback((key: LandingDictKey) => DICT[language][key], [language]);
}
