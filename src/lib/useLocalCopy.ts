"use client";

import { useLandingLanguage } from "@/lib/landingI18n";

/**
 * 8개 로케일 전체 번역 부담이 큰 보조 화면(신규 랜딩 섹션, 다운로드 페이지 등)을 위한
 * 경량 로컬 카피 헬퍼. 한국어 사용자는 ko, 그 외에는 en 으로 폴백한다.
 */
export function useLocalCopy<T>(copy: { ko: T; en: T }): T {
  const { language } = useLandingLanguage();
  return language === "ko" ? copy.ko : copy.en;
}
