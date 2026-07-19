"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { getLanguage, getServerLanguage, subscribeLanguage } from "@/lib/languageStore";
import type { AppLanguage } from "@/lib/languages";

const emptySubscribe = () => () => {};

// i18n.ts(전체 사전)를 여기서 import하면 랜딩·로그인 등 모든 페이지 번들에 9개 언어
// 앱 사전이 통째로 실린다(이 버튼은 헤더마다 쓰임). aria-label 두 개뿐이라 로컬로 둔다.
const ARIA: Record<AppLanguage, { light: string; dark: string }> = {
  ko: { light: "라이트 모드로 전환", dark: "다크 모드로 전환" },
  en: { light: "Switch to light mode", dark: "Switch to dark mode" },
  ja: { light: "ライトモードに切り替え", dark: "ダークモードに切り替え" },
  zh: { light: "切换为浅色模式", dark: "切换为深色模式" },
  ru: { light: "Светлая тема", dark: "Тёмная тема" },
  de: { light: "Zum hellen Modus wechseln", dark: "Zum dunklen Modus wechseln" },
  fr: { light: "Passer en mode clair", dark: "Passer en mode sombre" },
  es: { light: "Cambiar a modo claro", dark: "Cambiar a modo oscuro" },
  ar: { light: "التبديل إلى الوضع الفاتح", dark: "التبديل إلى الوضع الداكن" },
};

export default function ThemeToggle({
  className = "",
  /** 사이드바 등 좁은 영역 — 슬라이드 모션 없이 fade만 (밖으로 튀는 현상 방지) */
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const lang = useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);
  const aria = ARIA[lang] ?? ARIA.en;
  const { resolvedTheme, setTheme } = useTheme();
  // SSR/하이드레이션 중에는 false, 클라이언트 마운트 후 true — effect에서 setState 없이 처리.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? aria.light : aria.dark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 text-slate-600 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-blue-400/60 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:text-white ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={
            compact
              ? { opacity: 0, scale: 0.85 }
              : { y: 12, opacity: 0, rotate: -30 }
          }
          animate={
            compact
              ? { opacity: 1, scale: 1 }
              : { y: 0, opacity: 1, rotate: 0 }
          }
          exit={
            compact
              ? { opacity: 0, scale: 0.85 }
              : { y: -12, opacity: 0, rotate: 30 }
          }
          transition={{ duration: compact ? 0.2 : 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-center"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
