/** 홈·워크스페이스 공통 지원 언어 */
export type AppLanguage = "en" | "ko" | "ja" | "zh" | "ru" | "de" | "fr" | "es" | "ar";

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  ar: "العربية",
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
  "ar",
];

/** 오른쪽→왼쪽으로 읽는 언어 (RTL). */
export const RTL_LANGUAGES: ReadonlySet<AppLanguage> = new Set<AppLanguage>(["ar"]);

export function isRtlLanguage(lang: AppLanguage | string | null | undefined): boolean {
  return !!lang && RTL_LANGUAGES.has(lang as AppLanguage);
}
