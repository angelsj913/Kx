"use client";

import { useEffect } from "react";
import { useAppLanguage } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/languages";

/**
 * 현재 언어에 맞춰 <html>의 dir(rtl/ltr)과 lang을 갱신한다.
 * 아랍어 등 RTL 언어를 고르면 문서 방향이 오른쪽→왼쪽으로 바뀐다.
 * 렌더링 없이 부수효과만 담당한다.
 */
export default function DirectionSync() {
  const lang = useAppLanguage();
  useEffect(() => {
    const root = document.documentElement;
    root.dir = isRtlLanguage(lang) ? "rtl" : "ltr";
    root.lang = lang;
  }, [lang]);
  return null;
}
