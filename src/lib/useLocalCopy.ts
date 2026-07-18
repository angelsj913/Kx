"use client";

import { useLandingLanguage, type LandingLanguage } from "@/lib/landingI18n";

/** 보조 화면(신규 랜딩 섹션 등)용 로컬 카피 헬퍼. 일부 언어(예: 아랍어) 카피가
 *  없으면 영어로 폴백한다 — 랜딩 마케팅 카피는 전 로케일을 강제하지 않는다. */
export function useLocalCopy<T>(
  copy: Partial<Record<LandingLanguage, T>> & { en: T },
): T {
  const { language } = useLandingLanguage();
  return copy[language] ?? copy.en;
}
