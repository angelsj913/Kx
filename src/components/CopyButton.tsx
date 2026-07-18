"use client";

import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * 복사 버튼 — 누르면 라벨이 잠시 "복사됨!"(현재 언어)으로 바뀐다.
 * chat.copied 키가 8개 언어에 이미 있어 언어별로 자동 표기된다.
 */
export default function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = () => {
    void navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      title={copied ? t("chat.copied") : t("chat.copy")}
      className={
        className ??
        "inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
      }
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? `${t("chat.copied")}!` : t("chat.copy")}
    </button>
  );
}
