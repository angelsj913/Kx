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
import {
  getLanguage,
  getServerLanguage,
  setLanguage as setSharedLanguage,
  subscribeLanguage,
} from "../languageStore";

export type LandingLanguage = AppLanguage;
export { LANGUAGE_LABELS, LANGUAGE_ORDER };

const DICT: Record<LandingLanguage, Record<keyof typeof ko, string>> = { ko, en, ja, zh, ru, de, fr, es };

// 앱·랜딩·결제창이 languageStore 하나를 공유한다(별도 캐시로 인한 언어 되돌림 버그 방지).
export function setLandingLanguage(lang: LandingLanguage) {
  setSharedLanguage(lang);
}

export function useLandingLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);
  return { language, setLanguage: setLandingLanguage };
}

export type LandingDictKey = keyof typeof ko;

export function useLandingT() {
  const { language } = useLandingLanguage();
  return useCallback((key: LandingDictKey) => DICT[language][key], [language]);
}
