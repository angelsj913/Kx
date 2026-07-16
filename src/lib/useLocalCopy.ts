"use client";

import { useLandingLanguage, type LandingLanguage } from "@/lib/landingI18n";

/** 8개 로케일 전체 카피를 받는 보조 화면(신규 랜딩 섹션 등)용 로컬 카피 헬퍼. */
export function useLocalCopy<T>(copy: Record<LandingLanguage, T>): T {
  const { language } = useLandingLanguage();
  return copy[language] ?? copy.en;
}
