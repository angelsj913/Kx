"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** 모든 하위 페이지·탭 상단에 배치하는 공통 뒤로가기 버튼. fallbackHref가 있으면 히스토리가 없을 때 그 곳으로 이동. */
export default function BackButton({
  label = "뒤로가기",
  fallbackHref = "/",
  className = "",
}: {
  label?: string;
  fallbackHref?: string;
  className?: string;
}) {
  const router = useRouter();

  function onBack() {
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
      {label}
    </button>
  );
}
