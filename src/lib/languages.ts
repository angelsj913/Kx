/** 홈·워크스페이스 공통 지원 언어 */
export type AppLanguage = "en" | "ko" | "ja" | "zh" | "ru" | "de" | "fr" | "es";

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

export const LANGUAGE_ORDER: AppLanguage[] = [
  "en",
  "ko",
  "ja",
  "zh",
  "ru",
  "de",
  "fr",
  "es",
];
