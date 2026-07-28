"use client";

import { useMemo, useState } from "react";
import { useT, type AppDictKey } from "@/lib/i18n";
import {
  FileText,
  Presentation,
  Table2,
  File,
  Download,
  Terminal,
  FolderOpen,
  ChevronRight,
  Loader2,
  Paperclip,
  Eye,
  ImageIcon,
  ExternalLink,
  ListOrdered,
  Pencil,
  Check,
  Circle,
} from "lucide-react";

export type PanelTab = "files" | "plan" | "terminal";

export interface ChatArtifact {
  id: string;
  kind: "pptx" | "xlsx" | "doc" | "structured" | "attachment" | "text" | "image";
  title: string;
  subtitle?: string;
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  /** 메시지 id — 클릭 시 포커스용 */
  messageId?: string;
  /** 타임라인 표시용 (ISO 또는 짧은 시각) */
  timeLabel?: string;
}

export interface TerminalLine {
  id: string;
  time: string;
  text: string;
  level?: "info" | "ok" | "error" | "warn";
}

export interface ContextSource {
  id: string;
  title: string;
  snippet: string;
  source?: "library" | "web";
  url?: string;
}

export type PlanStepStatus = "pending" | "active" | "done" | "error";

export interface PlanStep {
  id: string;
  label: string;
  detail?: string;
  status: PlanStepStatus;
}

const CONTEXT_CHIP_MAX = 5;

const TAB_META: { id: PanelTab; labelKey: AppDictKey; icon: typeof FolderOpen }[] = [
  { id: "files", labelKey: "panel.tab.files", icon: FolderOpen },
  { id: "plan", labelKey: "panel.tab.plan", icon: ListOrdered },
  { id: "terminal", labelKey: "panel.tab.terminal", icon: Terminal },
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
    case "image":
      return ImageIcon;
    default:
      return File;
  }
}

function kindLabel(kind: ChatArtifact["kind"], t: (key: AppDictKey) => string) {
  switch (kind) {
    case "pptx":
      return "PowerPoint";
    case "xlsx":
      return "Excel";
    case "doc":
      return t("artifact.document");
    case "structured":
      return t("panel.kind.structured");
    case "attachment":
      return t("panel.kind.attachment");
    case "image":
      return t("artifact.image");
    default:
      return t("panel.kind.text");
  }
}

function isEditableArtifact(kind: ChatArtifact["kind"]) {
  return kind === "pptx" || kind === "xlsx" || kind === "structured" || kind === "doc";
}

export default function ChatRightPanel({
  open,
  onToggle,
  tab,
  onTabChange,
  artifacts,
  contextSources,
  planSteps,
  terminalLines,
  loading,
  onSelectArtifact,
  isAdmin = false,
}: {
  open: boolean;
  onToggle: () => void;
  tab: PanelTab;
  onTabChange: (t: PanelTab) => void;
  artifacts: ChatArtifact[];
  contextSources: ContextSource[];
  planSteps: PlanStep[];
  terminalLines: TerminalLine[];
  loading: boolean;
  onSelectArtifact?: (a: ChatArtifact) => void;
  /** 터미널 탭은 관리자에게만 보인다. */
  isAdmin?: boolean;
}) {
  const t = useT();
  const visibleTabs = useMemo(
    () => TAB_META.filter((m) => m.id !== "terminal" || isAdmin),
    [isAdmin],
  );
  const emptyHint = useMemo(() => {
    if (tab === "files") return t("panel.emptyHint.files");
    if (tab === "plan") return t("panel.emptyHint.plan");
    return t("panel.emptyHint.terminal");
  }, [tab, t]);

  if (!open) {
    return (
      <div className="flex h-full w-10 shrink-0 flex-col items-center border-l border-slate-200 bg-white/90 py-3 dark:border-slate-800 dark:bg-slate-900/70">
        <button
          type="button"
          onClick={onToggle}
          title={t("panel.openRight")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <div className="mt-3 flex flex-col items-center gap-2">
          {visibleTabs.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={t(labelKey)}
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
          {t("chat.workPanel")}
        </p>
        <button
          type="button"
          onClick={onToggle}
          title={t("panel.collapseRight")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <ContextDock sources={contextSources} />

      <div className="flex gap-1 border-b border-slate-200 p-1.5 dark:border-slate-800">
        {visibleTabs.map(({ id, labelKey, icon: Icon }) => (
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
            <span className="hidden truncate lg:inline">{t(labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "files" && (
          artifacts.length === 0 ? (
            <EmptyState text={emptyHint} />
          ) : (
            <OutputTimeline
              artifacts={artifacts}
              onSelectArtifact={onSelectArtifact}
            />
          )
        )}

        {tab === "plan" && (
          planSteps.length === 0 ? (
            <EmptyState text={emptyHint} />
          ) : (
            <PlanExecuteList steps={planSteps} loading={loading} />
          )
        )}

        {tab === "terminal" && isAdmin && (
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

function OutputTimeline({
  artifacts,
  onSelectArtifact,
}: {
  artifacts: ChatArtifact[];
  onSelectArtifact?: (a: ChatArtifact) => void;
}) {
  const t = useT();
  return (
    <ul className="relative space-y-0">
      {artifacts.map((a, index) => {
        const Icon = kindIcon(a.kind);
        const editable = isEditableArtifact(a.kind);
        const isLast = index === artifacts.length - 1;
        return (
          <li key={a.id} className="relative flex gap-3 pb-4">
            <div className="flex w-4 shrink-0 flex-col items-center">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[var(--mode-accent,#2563eb)] ring-2 ring-white dark:ring-slate-900" />
              {!isLast && (
                <span className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
            <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-blue-500/40 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-500/30">
              <button
                type="button"
                onClick={() => onSelectArtifact?.(a)}
                className="flex w-full items-start gap-2.5 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {a.title}
                    </span>
                    {a.timeLabel && (
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-slate-400">
                        {a.timeLabel}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {kindLabel(a.kind, t)}
                    {a.subtitle ? ` · ${a.subtitle}` : ""}
                  </span>
                </span>
              </button>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectArtifact?.(a)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {editable ? (
                    <Pencil className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  {editable ? t("panel.continueEditing") : t("chat.openFile")}
                </button>
                {a.url && (
                  <>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("chat.openNewTab")}
                    </a>
                    <a
                      href={a.url}
                      download={a.fileName ?? undefined}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-blue-600/20"
                    >
                      <Download className="h-3 w-3" />
                      {t("chat.download")}
                    </a>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PlanExecuteList({
  steps,
  loading,
}: {
  steps: PlanStep[];
  loading: boolean;
}) {
  const t = useT();
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => {
        const done = step.status === "done";
        const active = step.status === "active";
        const err = step.status === "error";
        return (
          <li
            key={step.id}
            className={`rounded-xl border px-3 py-2.5 ${
              err
                ? "border-red-300/60 bg-red-50/80 dark:border-red-500/30 dark:bg-red-950/30"
                : active
                  ? "border-blue-500/40 bg-blue-600/5 dark:bg-blue-500/10"
                  : done
                    ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                    : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  err
                    ? "bg-red-500/15 text-red-600"
                    : done
                      ? "bg-emerald-500/15 text-emerald-600"
                      : active
                        ? "bg-blue-600/15 text-blue-700 dark:text-blue-300"
                        : "bg-slate-200/80 text-slate-400 dark:bg-slate-800"
                }`}
              >
                {err ? (
                  <Circle className="h-3 w-3" />
                ) : done ? (
                  <Check className="h-3 w-3" />
                ) : active && loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="font-mono text-[9px] font-bold">{i + 1}</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  <span className="mr-1.5 font-mono text-[9px] uppercase tracking-wide text-slate-400">
                    {t("panel.stepPrefix")} {i + 1}
                  </span>
                  {step.label}
                </p>
                {step.detail && (
                  <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {step.detail}
                  </p>
                )}
                <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-slate-400">
                  {err
                    ? t("panel.plan.failed")
                    : done
                      ? t("panel.plan.done")
                      : active
                        ? t("panel.plan.running")
                        : t("panel.plan.pending")}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ContextDock({ sources }: { sources: ContextSource[] }) {
  const t = useT();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visible = sources.slice(0, CONTEXT_CHIP_MAX);
  const overflow = sources.length - visible.length;
  const expanded = expandedId
    ? sources.find((s) => s.id === expandedId)
    : undefined;

  return (
    <section className="border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {t("panel.context.title")}
      </p>
      {sources.length === 0 ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t("panel.context.empty")}
        </p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap gap-1">
            {visible.map((s) => {
              const active = expandedId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setExpandedId(active ? null : s.id)}
                  className={`max-w-full truncate rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                    active
                      ? "border-[var(--mode-accent)]/50 bg-[var(--mode-accent)]/10 text-[var(--mode-accent)]"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                  }`}
                  title={s.title}
                >
                  {s.source === "web" ? "web · " : ""}
                  {s.title}
                </button>
              );
            })}
            {overflow > 0 && (
              <span
                className="inline-flex items-center rounded-md border border-dashed border-slate-300 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-600 dark:text-slate-500"
                title={sources
                  .slice(CONTEXT_CHIP_MAX)
                  .map((s) => s.title)
                  .join(", ")}
              >
                +{overflow}
              </span>
            )}
          </div>
          {expanded && (
            <ContextSnippet
              source={expanded}
              onClose={() => setExpandedId(null)}
            />
          )}
        </>
      )}
    </section>
  );
}

function ContextSnippet({
  source,
  onClose,
}: {
  source: ContextSource;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
          {source.title}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {t("chat.closePreview")}
        </button>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
        {source.snippet}
      </p>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-[var(--mode-accent)] hover:underline"
        >
          <ExternalLink className="h-3 w-3" aria-hidden />
          {t("chat.openNewTab")}
        </a>
      )}
    </div>
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
