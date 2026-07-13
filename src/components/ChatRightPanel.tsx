"use client";

import { useMemo } from "react";
import {
  FileText,
  Presentation,
  Table2,
  File,
  Download,
  ListTodo,
  Terminal,
  FolderOpen,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  Paperclip,
} from "lucide-react";

export type PanelTab = "files" | "plan" | "terminal";

export interface ChatArtifact {
  id: string;
  kind: "pptx" | "xlsx" | "doc" | "structured" | "attachment" | "text";
  title: string;
  subtitle?: string;
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  /** 메시지 id — 클릭 시 포커스용 */
  messageId?: string;
}

export interface PlanStep {
  id: string;
  label: string;
  /** pending | active | done */
  status: "pending" | "active" | "done";
}

export interface TerminalLine {
  id: string;
  time: string;
  text: string;
  level?: "info" | "ok" | "error" | "warn";
}

const TAB_META: { id: PanelTab; label: string; icon: typeof FolderOpen }[] = [
  { id: "files", label: "자료", icon: FolderOpen },
  { id: "plan", label: "계획", icon: ListTodo },
  { id: "terminal", label: "터미널", icon: Terminal },
];

function kindIcon(kind: ChatArtifact["kind"]) {
  switch (kind) {
    case "pptx":
      return Presentation;
    case "xlsx":
      return Table2;
    case "doc":
    case "text":
      return FileText;
    case "attachment":
      return Paperclip;
    default:
      return File;
  }
}

function kindLabel(kind: ChatArtifact["kind"]) {
  switch (kind) {
    case "pptx":
      return "PowerPoint";
    case "xlsx":
      return "Excel";
    case "doc":
      return "문서";
    case "structured":
      return "구조화";
    case "attachment":
      return "첨부";
    default:
      return "텍스트";
  }
}

export default function ChatRightPanel({
  open,
  onToggle,
  tab,
  onTabChange,
  artifacts,
  planSteps,
  terminalLines,
  loading,
  onSelectArtifact,
}: {
  open: boolean;
  onToggle: () => void;
  tab: PanelTab;
  onTabChange: (t: PanelTab) => void;
  artifacts: ChatArtifact[];
  planSteps: PlanStep[];
  terminalLines: TerminalLine[];
  loading: boolean;
  onSelectArtifact?: (a: ChatArtifact) => void;
}) {
  const emptyHint = useMemo(() => {
    if (tab === "files") return "채팅에서 생성된 PPT · 엑셀 · 문서가 여기에 모입니다.";
    if (tab === "plan") return "작업을 시작하면 단계별 계획이 표시됩니다.";
    return "AI 처리 로그가 여기에 실시간으로 표시됩니다.";
  }, [tab]);

  if (!open) {
    return (
      <div className="flex h-full w-10 shrink-0 flex-col items-center border-l border-slate-200 bg-white/90 py-3 dark:border-slate-800 dark:bg-slate-900/70">
        <button
          type="button"
          onClick={onToggle}
          title="우측 패널 열기"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <div className="mt-3 flex flex-col items-center gap-2">
          {TAB_META.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => {
                onTabChange(id);
                if (!open) onToggle();
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                tab === id
                  ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        {loading && (
          <Loader2 className="mt-auto h-4 w-4 animate-spin text-blue-500" />
        )}
      </div>
    );
  }

  return (
    <aside className="flex h-full min-w-0 flex-col border-l border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/80 dark:backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          작업 패널
        </p>
        <button
          type="button"
          onClick={onToggle}
          title="우측 패널 접기"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-200 p-1.5 dark:border-slate-800">
        {TAB_META.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              tab === id
                ? "bg-blue-600/10 text-blue-700 ring-1 ring-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden truncate lg:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "files" && (
          artifacts.length === 0 ? (
            <EmptyState text={emptyHint} />
          ) : (
            <ul className="space-y-2">
              {artifacts.map((a) => {
                const Icon = kindIcon(a.kind);
                return (
                  <li key={a.id}>
                    <div className="group rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-blue-500/40 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-500/30">
                      <button
                        type="button"
                        onClick={() => onSelectArtifact?.(a)}
                        className="flex w-full items-start gap-2.5 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {a.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            {kindLabel(a.kind)}
                            {a.subtitle ? ` · ${a.subtitle}` : ""}
                          </span>
                        </span>
                      </button>
                      {a.url && (
                        <a
                          href={a.url}
                          download={a.fileName ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-blue-600/20"
                        >
                          <Download className="h-3 w-3" />
                          다운로드
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        )}

        {tab === "plan" && (
          planSteps.length === 0 ? (
            <EmptyState text={emptyHint} />
          ) : (
            <ol className="space-y-2">
              {planSteps.map((step, i) => (
                <li
                  key={step.id}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
                    step.status === "active"
                      ? "border-blue-500/40 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/30"
                      : step.status === "done"
                        ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40"
                        : "border-slate-200/80 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-900/20"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {step.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : step.status === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium text-slate-400">
                      단계 {i + 1}
                    </span>
                    <span
                      className={`block text-sm ${
                        step.status === "pending"
                          ? "text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {step.label}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )
        )}

        {tab === "terminal" && (
          terminalLines.length === 0 ? (
            <EmptyState text={emptyHint} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-200 shadow-inner">
              <div className="flex items-center gap-1.5 border-b border-slate-800 px-3 py-1.5 text-[10px] text-slate-500">
                <span className="h-2 w-2 rounded-full bg-red-500/80" />
                <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                <span className="ml-2">zeff · agent</span>
              </div>
              <ul className="max-h-full space-y-1 overflow-y-auto p-3">
                {terminalLines.map((line) => (
                  <li key={line.id} className="flex gap-2">
                    <span className="shrink-0 text-slate-500">{line.time}</span>
                    <span
                      className={
                        line.level === "error"
                          ? "text-red-400"
                          : line.level === "ok"
                            ? "text-emerald-400"
                            : line.level === "warn"
                              ? "text-amber-300"
                              : "text-slate-200"
                      }
                    >
                      {line.text}
                    </span>
                  </li>
                ))}
                {loading && (
                  <li className="flex gap-2 text-blue-400">
                    <span className="shrink-0 text-slate-500">···</span>
                    <span className="animate-pulse">processing…</span>
                  </li>
                )}
              </ul>
            </div>
          )
        )}
      </div>
    </aside>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500">
        <FolderOpen className="h-5 w-5" />
      </div>
      <p className="max-w-[14rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {text}
      </p>
    </div>
  );
}
