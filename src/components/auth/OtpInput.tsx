"use client";

import { useRef } from "react";

/** 6칸 숫자 OTP 입력. 값은 상위에서 문자열로 관리한다. */
export default function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function setDigit(i: number, d: string) {
    const clean = d.replace(/\D/g, "");
    const next = digits.slice();
    next[i] = clean.slice(-1);
    const joined = next.join("").slice(0, 6);
    onChange(joined);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text) {
      e.preventDefault();
      onChange(text);
      refs.current[Math.min(text.length, 5)]?.focus();
    }
  }

  return (
    <div className="flex justify-between gap-2" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white text-center text-lg font-semibold text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      ))}
    </div>
  );
}
