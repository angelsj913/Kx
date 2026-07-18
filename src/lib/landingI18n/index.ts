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

// 아랍어 랜딩 — 핵심(로그인·내비)만 번역하고 나머지는 영어로 폴백. RTL은 전역 dir로 처리.
const arCore: Partial<Record<keyof typeof ko, string>> = {
  "login.title": "تسجيل الدخول إلى ZEFF AI",
  "login.subtitle": "سجّل الدخول للمتابعة",
  "login.google": "المتابعة عبر Google",
  "login.or": "أو",
  "login.email": "البريد الإلكتروني",
  "login.password": "كلمة المرور",
  "login.submit": "تسجيل الدخول",
  "login.signup": "إنشاء حساب",
  "login.findPassword": "نسيت كلمة المرور؟",
  "nav.about": "نبذة",
  "nav.download": "تنزيل",
  "nav.support": "الدعم",
  "header.support": "الدعم",
};
const ar: Record<keyof typeof ko, string> = { ...en, ...arCore };

const DICT: Record<LandingLanguage, Record<keyof typeof ko, string>> = { ko, en, ja, zh, ru, de, fr, es, ar };

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
