"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";

/**
 * 모든 하위 페이지·탭 상단에 배치하는 공통 뒤로가기 버튼.
 * - label: 생략 시 현재 언어의 "뒤로가기" 번역을 사용
 * - fallbackHref: 히스토리가 없을 때 이동할 경로
 * - forceFallback: true 이면 항상 fallbackHref 로 이동 (로그인/회원가입 페이지처럼 히스토리를 타면 안 되는 곳에 사용)
 */
export default function BackButton({
  label,
  fallbackHref = "/",
  forceFallback = false,
  className = "",
}: {
  label?: string;
  fallbackHref?: string;
  forceFallback?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const t = useLandingT();
  const resolvedLabel = label ?? t("common.back");

  function onBack() {
    if (forceFallback) {
      router.push(fallbackHref);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={onBack}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {resolvedLabel}
    </button>
  );
}
