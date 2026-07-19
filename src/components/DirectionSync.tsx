"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getLanguage, getServerLanguage, subscribeLanguage } from "@/lib/languageStore";
import { isRtlLanguage } from "@/lib/languages";

/**
 * 현재 언어에 맞춰 <html>의 dir(rtl/ltr)과 lang을 갱신한다.
 * 아랍어 등 RTL 언어를 고르면 문서 방향이 오른쪽→왼쪽으로 바뀐다.
 * 렌더링 없이 부수효과만 담당한다.
 *
 * 주의: i18n.ts(전체 번역 사전)를 import하면 이 컴포넌트가 전역 마운트라서
 * 9개 언어 앱 사전 전체가 랜딩·로그인 등 모든 페이지 번들에 실려 나간다.
 * 여기서는 사전이 필요 없으므로 languageStore만 직접 구독한다.
 */
export default function DirectionSync() {
  const lang = useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);
  useEffect(() => {
    const root = document.documentElement;
    root.dir = isRtlLanguage(lang) ? "rtl" : "ltr";
    root.lang = lang;
  }, [lang]);
  return null;
}
