"use client";

import { useState } from "react";
import { Wand2, Link as LinkIcon } from "lucide-react";
import ResultPanel from "@/components/ResultPanel";
import FileResultPanel from "@/components/FileResultPanel";
import AudioInput from "@/components/AudioInput";
import ModelSelect from "@/components/ModelSelect";
import { addHistoryItem } from "@/lib/history";
import { DEFAULT_MODEL } from "@/lib/models";
import { keyHeaders } from "@/lib/apiKeys";
import type { ToolDef } from "@/lib/tools";
import type { Deck, Workbook, GeneratedFile } from "@/lib/fileTypes";

const MAX_CHARS = 4000;

interface FileResult {
  outputType: "pptx" | "xlsx";
  deck?: Deck;
  workbook?: Workbook;
  file: GeneratedFile;
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now());
}

export default function GeneratorView({ tool }: { tool: ToolDef }) {
  const [text, setText] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [fileResult, setFileResult] = useState<FileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isText = tool.inputType === "text";
  const isUrl = tool.inputType === "url";
  const isAudio = tool.inputType === "audio";

  const canSubmit = isAudio ? !!audioFile : !!text.trim();

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");
    setMarkdown("");
    setFileResult(null);

    try {
      let res: Response;
      if (isAudio && audioFile) {
        const form = new FormData();
        form.append("toolId", tool.id);
        form.append("model", model);
        form.append("audio", audioFile);
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { ...keyHeaders() },
          body: form,
        });
      } else {
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...keyHeaders() },
          body: JSON.stringify({ toolId: tool.id, text: text.trim(), model }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "요청에 실패했습니다.");

      const promptLabel = isAudio ? audioFile?.name ?? "오디오 파일" : text.trim();

      if (data.outputType === "pptx" || data.outputType === "xlsx") {
        setFileResult({
          outputType: data.outputType,
          deck: data.outputType === "pptx" ? data.preview : undefined,
          workbook: data.outputType === "xlsx" ? data.preview : undefined,
          file: data.file,
        });
        addHistoryItem({
          id: newId(),
          toolId: tool.id,
          toolLabel: tool.short,
          outputType: data.outputType,
          prompt: promptLabel,
          result: data.raw ?? "",
          createdAt: Date.now(),
        });
      } else {
        setMarkdown(data.text);
        addHistoryItem({
          id: newId(),
          toolId: tool.id,
          toolLabel: tool.short,
          outputType: "markdown",
          prompt: promptLabel,
          result: data.text,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* 입력 영역 */}
      <section className="flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-100">{tool.title}</h2>
          {isText && (
            <div className="shrink-0">
              <ModelSelect model={model} onChange={setModel} disabled={loading} />
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-400">{tool.description}</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col">
          {isText && (
            <div className="relative flex-1">
              <textarea
                value={text}
                maxLength={MAX_CHARS}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
                }}
                placeholder={tool.placeholder}
                className="h-full min-h-[220px] w-full resize-y rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 pb-9 text-base text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
              />
              <span
                className={`pointer-events-none absolute bottom-3 right-4 text-xs tabular-nums ${
                  text.length >= MAX_CHARS ? "text-red-400" : "text-slate-500"
                }`}
              >
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          )}

          {isUrl && (
            <div className="flex flex-1 flex-col">
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={tool.placeholder}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 py-3.5 pl-11 pr-4 text-base text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                YouTube 등 영상 주소를 붙여넣으면 내용을 분석해 정리합니다.
              </p>
            </div>
          )}

          {isAudio && (
            <AudioInput file={audioFile} onChange={setAudioFile} disabled={loading} />
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-all duration-300 hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                AI가 작업 중...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                {tool.submitLabel}
              </>
            )}
          </button>
        </form>
      </section>

      {/* 결과 영역 */}
      <div className="min-h-[360px]">
        {fileResult ? (
          <FileResultPanel
            outputType={fileResult.outputType}
            deck={fileResult.deck}
            workbook={fileResult.workbook}
            file={fileResult.file}
          />
        ) : (
          <ResultPanel
            content={markdown}
            loading={loading}
            error={error}
            fileBaseName={tool.fileBaseName}
          />
        )}
      </div>
    </div>
  );
}
