"use client";

import { Sparkles, Download, FileText, Presentation, Table2 } from "lucide-react";
import type { Deck, Workbook, GeneratedFile } from "@/lib/fileTypes";

export default function FileResultPanel({
  outputType,
  deck,
  workbook,
  file,
}: {
  outputType: "pptx" | "xlsx";
  deck?: Deck;
  workbook?: Workbook;
  file?: GeneratedFile;
}) {
  const isPptx = outputType === "pptx";
  const title = isPptx ? deck?.title : workbook?.title;
  const HeaderIcon = isPptx ? Presentation : Table2;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-2xl shadow-black/40 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/50 px-4 py-3 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-300">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-400" />
          <span className="truncate">{title || "결과"}</span>
        </h2>
        {file && (
          <a
            href={file.url}
            download={file.filename}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            {isPptx ? "PPT 다운로드" : "엑셀 다운로드"}
          </a>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {isPptx && deck ? (
          <ol className="space-y-3">
            {deck.slides.map((s, i) => (
              <li
                key={i}
                className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-600/20 text-[11px] font-bold text-violet-300">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {s.title}
                  </h3>
                </div>
                {s.bullets && s.bullets.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-8 text-sm text-slate-400">
                    {s.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
                {s.notes && (
                  <p className="mt-2 flex items-start gap-1.5 pl-8 text-xs text-slate-500">
                    <FileText className="mt-0.5 h-3 w-3 shrink-0" />
                    {s.notes}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : workbook ? (
          <div className="space-y-6">
            {workbook.sheets.map((sheet, si) => (
              <div key={si}>
                <p className="mb-2 text-xs font-semibold text-violet-300">
                  {sheet.name}
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-900/60">
                        {sheet.columns.map((c, i) => (
                          <th
                            key={i}
                            className="whitespace-nowrap border-b border-slate-700/50 px-3 py-2 font-semibold text-slate-200"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.rows.map((row, ri) => (
                        <tr key={ri} className="odd:bg-slate-900/20">
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="whitespace-nowrap border-b border-slate-800/60 px-3 py-2 text-slate-400"
                            >
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-900/60">
              <HeaderIcon className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">결과가 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
