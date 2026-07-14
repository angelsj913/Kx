"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  User,
  FileText,
  ImageIcon,
  Plus,
  Mic,
  Square,
  Volume2,
  PanelRight,
  Download,
  Printer,
  Copy,
  Check,
} from "lucide-react";
import {
  downloadMarkdown,
  downloadTextFile,
  openPrintableHtml,
} from "@/lib/textExport";
import { useT, toolUiLabel, featureGroupLabel } from "@/lib/i18n";
import { wsFetch } from "@/lib/workspaceClient";
import { useSpeech } from "@/lib/useSpeech";
import { useSettings } from "@/lib/useSettings";
import { groupedQuickTools } from "@/lib/quickTools";
import {
  toolAcceptAttr,
  toolRequiresAttachment,
  type ToolDef,
} from "@/lib/tools";
import type { StructuredKind } from "@/lib/structured";
import FileResultPanel from "./FileResultPanel";
import StructuredResultView from "./structured/StructuredResultView";
import Logo from "@/components/ui/Logo";
import ChatRightPanel, {
  type ChatArtifact,
  type PanelTab,
  type PlanStep,
  type TerminalLine,
} from "./ChatRightPanel";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const PANEL_WIDTH_KEY = "kx.chat.rightPanelWidth";
const PANEL_OPEN_KEY = "kx.chat.rightPanelOpen";
const PANEL_MIN = 240;
const PANEL_MAX = 560;
const PANEL_DEFAULT = 320;
const CHAT_MIN = 320;

/** 에이전트 작업 단계 (status key → 계획 단계) */
const PLAN_PIPELINE: { id: string; label: string; keys: string[] }[] = [
  {
    id: "select",
    label: "에이전트 선택 · 요청 분석",
    keys: ["status.agent.selecting", "status.analyzing", "status.routing"],
  },
  {
    id: "research",
    label: "자료 수집 · 컨텍스트 준비",
    keys: ["status.researching", "status.context", "status.reading"],
  },
  {
    id: "generate",
    label: "콘텐츠 · 파일 생성",
    keys: ["status.generating", "status.writing", "status.tool", "status.building"],
  },
  {
    id: "finalize",
    label: "결과 정리 · 응답 완성",
    keys: ["status.finalizing", "status.saving", "status.done"],
  },
];

interface StoredAttachment {
  url: string;
  filename: string;
  mimeType: string;
}

interface PendingFile {
  file: File;
  previewUrl: string;
}

interface Msg {
  id: string;
  role: "user" | "model";
  text: string;
  attachments?: StoredAttachment[] | null;
  outputType?: string;
  structuredKind?: string | null;
  resultData?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
}

interface StreamEvent {
  type: "status" | "done" | "error";
  sessionId: string;
  key?: string;
  detail?: string;
  message?: Msg | string;
}

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function readStoredWidth(): number {
  if (typeof window === "undefined") return PANEL_DEFAULT;
  const n = Number(window.localStorage.getItem(PANEL_WIDTH_KEY));
  if (!Number.isFinite(n)) return PANEL_DEFAULT;
  return Math.min(PANEL_MAX, Math.max(PANEL_MIN, n));
}

function readStoredOpen(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(PANEL_OPEN_KEY);
  if (v === null) return true;
  return v !== "0";
}

function buildArtifacts(messages: Msg[]): ChatArtifact[] {
  const list: ChatArtifact[] = [];
  for (const m of messages) {
    if (m.role === "user" && m.attachments?.length) {
      for (let i = 0; i < m.attachments.length; i++) {
        const a = m.attachments[i];
        list.push({
          id: `${m.id}-att-${i}`,
          kind: "attachment",
          title: a.filename,
          subtitle: a.mimeType,
          url: a.url,
          fileName: a.filename,
          mimeType: a.mimeType,
          messageId: m.id,
        });
      }
    }
    if (m.role !== "model") continue;
    if (m.outputType === "pptx") {
      let title = m.fileName || "프레젠테이션";
      try {
        if (m.resultData) title = JSON.parse(m.resultData)?.title || title;
      } catch {
        /* ignore */
      }
      list.push({
        id: `${m.id}-pptx`,
        kind: "pptx",
        title,
        subtitle: m.fileName ?? "PPTX",
        url: m.fileUrl,
        fileName: m.fileName,
        messageId: m.id,
      });
    } else if (m.outputType === "xlsx") {
      let title = m.fileName || "스프레드시트";
      try {
        if (m.resultData) title = JSON.parse(m.resultData)?.title || title;
      } catch {
        /* ignore */
      }
      list.push({
        id: `${m.id}-xlsx`,
        kind: "xlsx",
        title,
        subtitle: m.fileName ?? "XLSX",
        url: m.fileUrl,
        fileName: m.fileName,
        messageId: m.id,
      });
    } else if (m.outputType === "structured" && m.structuredKind) {
      list.push({
        id: `${m.id}-struct`,
        kind: "structured",
        title: m.structuredKind,
        subtitle: "구조화 결과",
        messageId: m.id,
      });
    } else if (
      m.outputType === "markdown" ||
      (m.fileUrl && m.fileName) ||
      (m.text && m.text.length > 40)
    ) {
      // 워드·시험지·노트 등 마크다운 산출물도 패널에서 열기/다운로드
      const titleFromName = m.fileName?.replace(/\.[^.]+$/, "") || null;
      const titleFromText =
        m.text.slice(0, 48).replace(/\s+/g, " ") + (m.text.length > 48 ? "…" : "");
      list.push({
        id: `${m.id}-doc`,
        kind: "doc",
        title: titleFromName || titleFromText || "문서",
        subtitle: m.fileName || (m.outputType === "markdown" ? "Markdown / Word" : "문서 응답"),
        url: m.fileUrl,
        fileName: m.fileName,
        messageId: m.id,
      });
    }
  }
  return list.reverse();
}

function buildPlanSteps(loading: boolean, statusKey: string | null): PlanStep[] {
  if (!loading && !statusKey) {
    // 유휴: 파이프라인 미리보기
    return PLAN_PIPELINE.map((p) => ({
      id: p.id,
      label: p.label,
      status: "pending" as const,
    }));
  }

  let activeIdx = 0;
  if (statusKey) {
    const found = PLAN_PIPELINE.findIndex((p) => p.keys.includes(statusKey));
    if (found >= 0) activeIdx = found;
    else if (loading) activeIdx = 0;
  }

  return PLAN_PIPELINE.map((p, i) => ({
    id: p.id,
    label: p.label,
    status: !loading && i <= activeIdx
      ? ("done" as const)
      : i < activeIdx
        ? ("done" as const)
        : i === activeIdx && loading
          ? ("active" as const)
          : ("pending" as const),
  }));
}

export default function ChatWorkspace({
  sessionId,
  onSessionCreated,
  onTurnSaved,
}: {
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
  onTurnSaved: () => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeQuickTool, setActiveQuickTool] = useState<ToolDef | null>(null);
  const [noteFormat, setNoteFormat] = useState<"markdown" | "pdf" | "image">("markdown");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 우측 패널 (데스크톱) / 모바일 시트 — localStorage는 lazy init (effect setState 금지)
  const [panelOpen, setPanelOpen] = useState(() => readStoredOpen());
  const [mobileSheet, setMobileSheet] = useState(false);
  const [panelWidth, setPanelWidth] = useState(() => readStoredWidth());
  const [panelTab, setPanelTab] = useState<PanelTab>("files");
  const [previewArtifact, setPreviewArtifact] = useState<ChatArtifact | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const dragging = useRef(false);

  const pushTerminal = useCallback((text: string, level: TerminalLine["level"] = "info") => {
    setTerminalLines((prev) => [
      ...prev.slice(-200),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time: nowTime(),
        text,
        level,
      },
    ]);
  }, []);

  // 음성 대화 모드
  const sendSpokenRef = useRef<(text: string) => void>(() => {});
  const {
    listening,
    speaking,
    interim,
    sttSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useSpeech({ onFinal: (text) => sendSpokenRef.current(text) });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  useEffect(() => {
    // 세션 전환 시 이전 대화가 잠깐 남지 않도록 즉시 비움
    setMessages([]);
    setError("");
    setStatusKey(null);
    if (!sessionId) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}`);
        const data = await res.json();
        if (!ignore && res.ok) {
          setMessages((data.session.history ?? []).map((m: Msg) => ({ ...m })));
        }
      } catch {
        // 무시
      }
    })();
    return () => {
      ignore = true;
    };
  }, [sessionId]);

  // 드래그로 채팅/패널 폭 조절
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current || !layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      const fromRight = rect.right - e.clientX;
      const maxW = Math.min(PANEL_MAX, rect.width - CHAT_MIN - 8);
      const next = Math.min(maxW, Math.max(PANEL_MIN, fromRight));
      setPanelWidth(next);
    }
    function onUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setPanelWidth((w) => {
        window.localStorage.setItem(PANEL_WIDTH_KEY, String(w));
        return w;
      });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    if (!panelOpen) {
      setPanelOpen(true);
      window.localStorage.setItem(PANEL_OPEN_KEY, "1");
    }
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function togglePanel() {
    setPanelOpen((v) => {
      const next = !v;
      window.localStorage.setItem(PANEL_OPEN_KEY, next ? "1" : "0");
      return next;
    });
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const added: PendingFile[] = [];
    for (const f of files) {
      if (f.size > 12 * 1024 * 1024) {
        setError(`${f.name}: 파일이 너무 큽니다 (최대 12MB).`);
        continue;
      }
      added.push({ file: f, previewUrl: URL.createObjectURL(f) });
    }
    setPending((p) => [...p, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(e?: React.FormEvent, spoken?: string) {
    e?.preventDefault();
    const spokenTurn = spoken !== undefined;
    let text = (spoken ?? draft).trim();
    // A4 노트 출력 형식 힌트를 본문에 주입
    if (!spokenTurn && activeQuickTool?.id === "note-a4") {
      text = text
        ? `${text}\n\n형식: ${noteFormat}`
        : `형식: ${noteFormat}\n첨부/입력 내용을 A4 노트로 정리해 주세요.`;
    }
    const requiresAttachment =
      !spokenTurn && activeQuickTool != null && toolRequiresAttachment(activeQuickTool);
    if (spokenTurn && !text) return;
    if (!spokenTurn && ((!text && pending.length === 0) || loading)) return;
    if (requiresAttachment && pending.length === 0) return;
    // mixed/url: 텍스트·첨부 중 하나는 있어야 함 (위에서 이미 검사)

    setError("");
    setLoading(true);
    setStatusKey("status.agent.selecting");
    setPanelTab((tab) => (tab === "files" ? "plan" : tab));
    pushTerminal(`$ zeff run — "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`, "info");
    pushTerminal("agent: selecting pipeline…", "info");

    const optimisticFiles: StoredAttachment[] = spokenTurn
      ? []
      : pending.map((p) => ({
          url: p.previewUrl,
          filename: p.file.name,
          mimeType: p.file.type || "application/octet-stream",
        }));
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: "user",
        text,
        attachments: optimisticFiles.length ? optimisticFiles : undefined,
      },
    ]);

    const filesToUpload = spokenTurn ? [] : pending.map((p) => p.file);
    const quickToolId = spokenTurn ? null : activeQuickTool?.id ?? null;
    if (!spokenTurn) {
      setDraft("");
      setPending([]);
      setActiveQuickTool(null);
    }

    try {
      const form = new FormData();
      form.append("text", text);
      if (sessionId) form.append("sessionId", sessionId);
      if (quickToolId) form.append("quickToolId", quickToolId);
      for (const f of filesToUpload) form.append("files", f);

      const res = await wsFetch("/api/chat", { method: "POST", body: form });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "요청에 실패했습니다.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let newSessionId: string | null = null;
      let doneMessage: Msg | null = null;
      let errorMessage: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          newSessionId = event.sessionId ?? newSessionId;
          if (event.type === "status") {
            const key = event.key ?? null;
            setStatusKey(key);
            if (key) {
              let label = key;
              try {
                label = t(key as Parameters<typeof t>[0]);
              } catch {
                /* keep key */
              }
              const extra = event.detail ? ` · ${event.detail}` : "";
              pushTerminal(`route › ${label}${extra}`, "info");
            }
          } else if (event.type === "done") {
            doneMessage = event.message as Msg;
          } else if (event.type === "error") {
            errorMessage = event.message as string;
          }
        }
      }

      if (errorMessage) throw new Error(errorMessage);
      if (!sessionId && newSessionId) onSessionCreated(newSessionId);
      if (doneMessage) {
        setMessages((prev) => [...prev, doneMessage as Msg]);
        if (spokenTurn && doneMessage.text) speak(doneMessage.text);
        pushTerminal("done ✓ response ready", "ok");
        if (
          doneMessage.outputType === "pptx" ||
          doneMessage.outputType === "xlsx" ||
          doneMessage.outputType === "structured"
        ) {
          setPanelTab("files");
          pushTerminal(
            `artifact › ${doneMessage.outputType}${doneMessage.fileName ? ` (${doneMessage.fileName})` : ""}`,
            "ok",
          );
        }
      }
      onTurnSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(msg);
      pushTerminal(`error ✗ ${msg}`, "error");
    } finally {
      setLoading(false);
      setStatusKey(null);
    }
  }

  useEffect(() => {
    sendSpokenRef.current = (text: string) => {
      if (loading) return;
      void send(undefined, text);
    };
  });

  const requiresAttachment =
    activeQuickTool != null && toolRequiresAttachment(activeQuickTool);
  const canSend =
    !loading &&
    (requiresAttachment
      ? pending.length > 0
      : draft.trim().length > 0 || pending.length > 0);

  const enabledQuickTools = settings?.enabledQuickTools ?? [];
  const featureGroups = groupedQuickTools(enabledQuickTools);

  const artifacts = useMemo(() => buildArtifacts(messages), [messages]);
  const planSteps = useMemo(
    () => buildPlanSteps(loading, statusKey),
    [loading, statusKey],
  );

  function scrollToMessage(id?: string) {
    if (!id) return;
    const el = messageRefs.current[id];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function openArtifact(a: ChatArtifact) {
    setPreviewArtifact(a);
    // 채팅 메시지로도 스크롤
    if (a.messageId) scrollToMessage(a.messageId);
  }

  return (
    <div ref={layoutRef} className="flex h-full min-w-0">
      {/* 채팅 영역 */}
      <div className="flex min-w-0 flex-1 flex-col px-3 py-3 sm:px-5 sm:py-4">
        <div className="mb-2 flex items-center justify-end sm:hidden">
          <button
            type="button"
            onClick={() => setMobileSheet(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <PanelRight className="h-3.5 w-3.5" />
            작업 패널
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-xl dark:shadow-black/30 dark:backdrop-blur-md sm:p-5"
        >
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 shadow-lg shadow-blue-600/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{t("chat.empty")}</p>
              <p className="max-w-sm text-xs text-slate-400 dark:text-slate-500">
                생성된 PPT · 엑셀 · 문서와 작업 계획·터미널은 오른쪽 패널에서 확인할 수 있습니다.
              </p>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div
                key={m.id}
                ref={(el) => {
                  messageRefs.current[m.id] = el;
                }}
                className="flex justify-end gap-2.5"
              >
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-blue-600/30">
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      {m.attachments.map((f, j) => (
                        <a
                          key={j}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[11px] hover:bg-white/25"
                        >
                          {f.mimeType.startsWith("image/") ? (
                            <ImageIcon className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          {f.filename}
                        </a>
                      ))}
                    </div>
                  )}
                  {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                </div>
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900/60">
                  <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
              </div>
            ) : (
              <div
                key={m.id}
                ref={(el) => {
                  messageRefs.current[m.id] = el;
                }}
                className="flex gap-2.5"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                {m.outputType === "pptx" || m.outputType === "xlsx" ? (
                  <div className="min-w-0 flex-1">
                    <FileResultPanel
                      outputType={m.outputType}
                      deck={
                        m.outputType === "pptx" && m.resultData
                          ? JSON.parse(m.resultData)
                          : undefined
                      }
                      workbook={
                        m.outputType === "xlsx" && m.resultData
                          ? JSON.parse(m.resultData)
                          : undefined
                      }
                      file={
                        m.fileUrl && m.fileName
                          ? {
                              url: m.fileUrl,
                              filename: m.fileName,
                              mimeType: m.outputType === "pptx" ? PPTX_MIME : XLSX_MIME,
                            }
                          : undefined
                      }
                    />
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{m.text}</p>
                  </div>
                ) : m.outputType === "structured" && m.structuredKind && m.resultData ? (
                  <div className="min-w-0 flex-1">
                    <StructuredResultView
                      key={m.id}
                      id={m.id}
                      kind={m.structuredKind as StructuredKind}
                      data={JSON.parse(m.resultData)}
                    />
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{m.text}</p>
                  </div>
                ) : (
                  <div className="min-w-0 max-w-[min(100%,40rem)] flex-1">
                    <div className="prose-ai rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                    {/* 짧은 답변: 복사만 / 긴 문서: 저장·인쇄 도구 */}
                    {m.text && m.text.length > 0 && m.text.length <= 80 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(m.text).catch(() => {});
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          title={t("chat.copy")}
                        >
                          <Copy className="h-3 w-3" />
                          {t("chat.copy")}
                        </button>
                      </div>
                    )}
                    {m.text && m.text.length > 80 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.fileUrl && m.fileName && (
                          <a
                            href={m.fileUrl}
                            download={m.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-600/10 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300"
                          >
                            <Download className="h-3 w-3" />
                            .md 저장
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(m.text).catch(() => {});
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          title={t("chat.copy")}
                        >
                          <Copy className="h-3 w-3" />
                          {t("chat.copy")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadMarkdown(
                              (m.fileName ?? "zeff-note").replace(/\.[^.]+$/, "") || "zeff-note",
                              m.text,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <FileText className="h-3 w-3" />
                          Markdown
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextFile(
                              `${(m.fileName ?? "zeff-note").replace(/\.[^.]+$/, "")}.txt`,
                              m.text,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                        >
                          TXT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openPrintableHtml(m.fileName ?? "ZEFF 문서", m.text)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          title="인쇄 대화상자에서 PDF로 저장"
                        >
                          <Printer className="h-3 w-3" />
                          PDF 인쇄
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ),
          )}

          {/* AI 작업 중 — 브랜드 로고 스핀 로딩 */}
          {loading && (
            <div className="flex gap-2.5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-white shadow-sm dark:border-blue-400/20 dark:bg-slate-900">
                <Logo size="sm" withWordmark={false} spin />
              </div>
              <div className="flex min-w-0 flex-col justify-center gap-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Logo size="sm" withWordmark spin className="!gap-1.5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {statusKey
                    ? t(statusKey as Parameters<typeof t>[0])
                    : "ZEFF가 작업을 처리하고 있습니다…"}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <form
          onSubmit={send}
          className="relative mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-xl dark:shadow-black/30 dark:backdrop-blur-md"
        >
          <div className="mb-1.5 flex h-4 items-center px-1">
            <AnimatePresence mode="wait">
              {statusKey && (
                <motion.span
                  key={statusKey}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-300"
                >
                  {t(statusKey as Parameters<typeof t>[0])}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {activeQuickTool && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/10 px-2.5 py-1 text-xs text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                <activeQuickTool.icon className="h-3.5 w-3.5" />
                {activeQuickTool.short}
                <button
                  type="button"
                  onClick={() => setActiveQuickTool(null)}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
              {activeQuickTool.id === "note-a4" &&
                (["markdown", "pdf", "image"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setNoteFormat(fmt)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                      noteFormat === fmt
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-slate-300 text-slate-600 hover:border-blue-400 dark:border-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {fmt === "markdown" ? "Markdown" : fmt === "pdf" ? "PDF용" : "이미지용"}
                  </button>
                ))}
              {activeQuickTool.id === "video-summary" && (
                <span className="text-[11px] text-slate-500">
                  URL 입력 또는 대본·오디오·캡처 첨부
                </span>
              )}
              {activeQuickTool.id === "exam-maker" && (
                <span className="text-[11px] text-slate-500">
                  과목·범위·키워드 → 20문항 + 해설
                </span>
              )}
            </div>
          )}

          {pending.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pending.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
                >
                  {p.file.type.startsWith("image/") ? (
                    <ImageIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span className="max-w-[10rem] truncate">{p.file.name}</span>
                  <button
                    type="button"
                    onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {(listening || speaking) && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-200">
              <span
                className={`flex h-2 w-2 rounded-full ${listening ? "animate-pulse bg-red-400" : "bg-blue-400"}`}
              />
              {listening ? (interim ? `“${interim}”` : "듣고 있어요…") : "답변을 읽는 중…"}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="relative shrink-0">
              <motion.button
                type="button"
                onClick={() => setQuickActionsOpen((v) => !v)}
                disabled={loading}
                whileTap={{ scale: 0.96 }}
                title={t("chat.quickActions")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition-colors hover:border-blue-500/50 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-blue-300"
              >
                <Plus className="h-5 w-5" />
              </motion.button>

              <AnimatePresence>
                {quickActionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute bottom-full left-0 z-20 mb-2 max-h-80 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-black/40 dark:backdrop-blur-md"
                  >
                    {featureGroups.map((g) => (
                      <QuickToolGroup
                        key={g.id}
                        label={featureGroupLabel(g.id, g.label, t)}
                        tools={g.tools}
                        onSelect={(tool) => {
                          setActiveQuickTool(tool);
                          setQuickActionsOpen(false);
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              title={t("chat.attach")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition-colors hover:border-blue-500/50 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-blue-300"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={toolAcceptAttr(activeQuickTool)}
              multiple
              onChange={onPickFiles}
              className="hidden"
            />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={activeQuickTool ? activeQuickTool.placeholder : t("chat.placeholder")}
              className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-600"
            />
            {sttSupported && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (listening) stopListening();
                  else if (speaking) stopSpeaking();
                  else startListening();
                }}
                disabled={loading && !listening && !speaking}
                title={listening ? "듣기 중지" : speaking ? "읽기 중지" : "음성으로 말하기"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  listening
                    ? "animate-pulse border-red-500/50 bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                    : speaking
                      ? "border-blue-500/50 bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
                      : "border-slate-300 bg-white text-slate-500 hover:border-blue-500/50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-blue-300"
                }`}
              >
                {listening ? (
                  <Square className="h-5 w-5" />
                ) : speaking ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </motion.button>
            )}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={!canSend}
              title={t("chat.send")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </div>
        </form>
      </div>

      {/* 드래그 리사이즈 핸들 */}
      {panelOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="채팅 영역 크기 조절"
          onMouseDown={startResize}
          className="group relative z-20 w-1.5 shrink-0 cursor-col-resize bg-transparent"
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200 transition-colors group-hover:bg-blue-500 group-active:bg-blue-600 dark:bg-slate-700 dark:group-hover:bg-blue-400" />
          <div className="absolute top-1/2 left-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-600" />
        </div>
      )}

      {/* 우측 작업 패널 */}
      <div
        className="hidden h-full shrink-0 sm:block"
        style={panelOpen ? { width: panelWidth } : undefined}
      >
        <ChatRightPanel
          open={panelOpen}
          onToggle={togglePanel}
          tab={panelTab}
          onTabChange={setPanelTab}
          artifacts={artifacts}
          planSteps={planSteps}
          terminalLines={terminalLines}
          loading={loading}
          onSelectArtifact={openArtifact}
        />
      </div>

      {/* 모바일: 시트로만 열림 (데스크톱 panelOpen 과 분리) */}
      <AnimatePresence>
        {mobileSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setMobileSheet(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute inset-y-0 right-0 w-[min(100%,22rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <ChatRightPanel
                open
                onToggle={() => setMobileSheet(false)}
                tab={panelTab}
                onTabChange={setPanelTab}
                artifacts={artifacts}
                planSteps={planSteps}
                terminalLines={terminalLines}
                loading={loading}
                onSelectArtifact={(a) => {
                  openArtifact(a);
                  setMobileSheet(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 파일 미리보기 오버레이 */}
      {previewArtifact && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewArtifact(null)} />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {previewArtifact.title}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {previewArtifact.subtitle || previewArtifact.kind}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {previewArtifact.url && (
                  <a
                    href={previewArtifact.url}
                    download={previewArtifact.fileName ?? undefined}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    다운로드
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewArtifact(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <ArtifactPreview messages={messages} artifact={previewArtifact} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArtifactPreview({
  messages,
  artifact,
}: {
  messages: Msg[];
  artifact: ChatArtifact;
}) {
  const msg = messages.find((m) => m.id === artifact.messageId);
  if (artifact.kind === "attachment" && artifact.url) {
    if (artifact.mimeType?.startsWith("image/")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artifact.url} alt={artifact.title} className="max-h-[70vh] w-full rounded-xl object-contain" />
      );
    }
    return (
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>첨부 파일 미리보기</p>
        <a href={artifact.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          새 탭에서 열기
        </a>
      </div>
    );
  }
  if ((artifact.kind === "pptx" || artifact.kind === "xlsx") && msg?.resultData) {
    try {
      const data = JSON.parse(msg.resultData);
      if (artifact.kind === "pptx") {
        return (
          <FileResultPanel
            outputType="pptx"
            deck={data}
            file={
              msg.fileUrl
                ? {
                    url: msg.fileUrl,
                    filename: msg.fileName || "deck.pptx",
                    mimeType: PPTX_MIME,
                  }
                : undefined
            }
          />
        );
      }
      return (
        <FileResultPanel
          outputType="xlsx"
          workbook={data}
          file={
            msg.fileUrl
              ? {
                  url: msg.fileUrl,
                  filename: msg.fileName || "sheet.xlsx",
                  mimeType: XLSX_MIME,
                }
              : undefined
          }
        />
      );
    } catch {
      /* fallthrough */
    }
  }
  if (artifact.kind === "structured" && msg?.resultData && msg.structuredKind) {
    try {
      const parsed = JSON.parse(msg.resultData);
      // structuredKind 문자열 → 뷰 매핑 (런타임 안전)
      return (
        <StructuredResultView
          id={msg.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ kind: msg.structuredKind, data: parsed } as any)}
        />
      );
    } catch {
      return (
        <pre className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950">
          {msg.resultData}
        </pre>
      );
    }
  }
  if (msg?.text) {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{msg.text}</ReactMarkdown>
      </div>
    );
  }
  if (artifact.url) {
    return (
      <iframe title={artifact.title} src={artifact.url} className="h-[70vh] w-full rounded-xl border border-slate-200 dark:border-slate-700" />
    );
  }
  return <p className="text-sm text-slate-500">미리볼 수 있는 내용이 없습니다. 다운로드를 이용해 주세요.</p>;
}


function QuickToolGroup({
  label,
  tools,
  onSelect,
}: {
  label: string;
  tools: ToolDef[];
  onSelect: (tool: ToolDef) => void;
}) {
  const t = useT();
  if (tools.length === 0) return null;
  return (
    <div className="border-b border-slate-200 p-2 last:border-b-0 dark:border-slate-800/60">
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelect(tool)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
          >
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {toolUiLabel(tool, t)}
          </button>
        );
      })}
    </div>
  );
}
