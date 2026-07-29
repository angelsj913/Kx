"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  MoreHorizontal,
  Printer,
  RotateCcw,
} from "lucide-react";
import CopyButton from "@/components/CopyButton";
import AnswerFeedbackButtons from "@/components/AnswerFeedbackButtons";
import {
  downloadTextFile,
  openPrintableHtml,
} from "@/lib/textExport";
import { useT } from "@/lib/i18n";

interface MessageActionsProps {
  messageId: string;
  sessionId: string | null;
  agentId?: string | null;
  outputType?: string;
  text: string;
  fileUrl?: string | null;
  fileName?: string | null;
  showRegenerate: boolean;
  onRegenerate: () => void;
}

function feedbackToolId(agentId?: string | null, outputType?: string): string | null {
  if (agentId?.startsWith("quicktool:")) return agentId.replace("quicktool:", "");
  if (outputType && outputType !== "chat") return outputType;
  return null;
}

export default function MessageActions({
  messageId,
  sessionId,
  agentId,
  outputType,
  text,
  fileUrl,
  fileName,
  showRegenerate,
  onRegenerate,
}: MessageActionsProps) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasSecondary =
    !!fileUrl ||
    !!fileName ||
    text.length > 0;

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const actionBtn =
    "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300";

  return (
    <div className="mt-2 flex flex-wrap items-start gap-1.5">
      <CopyButton text={text} iconOnly />
      {showRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className={actionBtn}
          title={t("chat.regenerate")}
          aria-label={t("chat.regenerate")}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
      <AnswerFeedbackButtons
        chatHistoryId={messageId}
        sessionId={sessionId}
        toolId={feedbackToolId(agentId, outputType)}
        inline
      />

      {hasSecondary && (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={actionBtn}
            title={t("chat.moreActions")}
            aria-label={t("chat.moreActions")}
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[10rem] overflow-hidden rounded-xl border border-slate-300 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900">
              {fileUrl && fileName && (
                <a
                  href={fileUrl}
                  download={fileName}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  {t("chat.saveMd")}
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  downloadTextFile(
                    `${(fileName ?? "zeff-note").replace(/\.[^.]+$/, "")}.txt`,
                    text,
                  );
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                {t("resultPanel.saveTxt")}
              </button>
              <button
                type="button"
                onClick={() => {
                  openPrintableHtml(fileName ?? t("chat.zeffDocument"), text);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Printer className="h-3.5 w-3.5 shrink-0" />
                {t("chat.printPdf")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
