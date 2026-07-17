"use client";

import { isValidElement, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/lib/i18n";

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    return extractText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/** ReactMarkdown용 `pre` 렌더러 — 코드블록마다 우측 상단에 복사 버튼을 얹는다.
 * react-markdown v10부터 `code` 컴포넌트의 `inline` prop이 사라져, 펜스 블록만
 * 구분하려면 `pre`를 감싸는 방식이 표준이다. */
export default function CodeBlockPre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  return (
    <div className="group/code relative">
      <pre {...props}>{children}</pre>
      <button
        type="button"
        onClick={() => {
          const text = extractText(children);
          void navigator.clipboard
            ?.writeText(text)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => {});
        }}
        title={copied ? t("chat.copied") : t("chat.copy")}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-slate-600/50 bg-slate-800/90 px-1.5 py-1 text-[11px] font-medium text-slate-200 opacity-0 transition-opacity group-hover/code:opacity-100 hover:bg-slate-700 focus-visible:opacity-100"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

export const markdownCodeComponents = { pre: CodeBlockPre };
