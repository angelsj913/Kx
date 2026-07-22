"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// 수식 렌더링 스타일 — 루트 레이아웃이 아니라 KaTeX를 실제로 쓰는 라우트에서만 로드
import "katex/dist/katex.min.css";
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
  Pencil,
  Check,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import {
  downloadTextFile,
  openPrintableHtml,
} from "@/lib/textExport";
import { useT, useAppLanguage, toolUiLabel, featureGroupLabel, type AppDictKey } from "@/lib/i18n";
import { LANGUAGE_LABELS, LANGUAGE_ORDER, type AppLanguage } from "@/lib/languages";
import { getToolPlaceholder } from "@/lib/toolPlaceholders";
import CopyButton from "@/components/CopyButton";
import AnswerFeedbackButtons from "@/components/AnswerFeedbackButtons";
import CitationCards, { parseCitationsFromResultData } from "@/components/CitationCards";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { wsFetch } from "@/lib/workspaceClient";
import { useSession } from "next-auth/react";
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
import { markdownCodeComponents } from "@/components/CodeBlockPre";
import ChatRightPanel, {
  type ChatArtifact,
  type PanelTab,
  type TerminalLine,
} from "./ChatRightPanel";
import KnowledgeBaseSheet from "./KnowledgeBaseSheet";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const PANEL_WIDTH_KEY = "kx.chat.rightPanelWidth";
const PANEL_OPEN_KEY = "kx.chat.rightPanelOpen";
const PANEL_MIN = 240;
const PANEL_MAX = 560;
const PANEL_DEFAULT = 320;
const CHAT_MIN = 320;

const ATTACH_FORMATS: {
  id: string;
  labelKey: AppDictKey;
  accept: string;
  icon: typeof ImageIcon;
}[] = [
  { id: "image", labelKey: "chat.attach.image", accept: "image/*", icon: ImageIcon },
  { id: "pdf", labelKey: "chat.attach.pdf", accept: "application/pdf,.pdf", icon: FileText },
  {
    id: "doc",
    labelKey: "chat.attach.document",
    accept:
      ".doc,.docx,.txt,.md,.hwp,.hwpx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: FileText,
  },
  { id: "audio", labelKey: "chat.attach.audio", accept: "audio/*,.mp3,.wav,.m4a", icon: Mic },
  { id: "other", labelKey: "chat.attach.other", accept: "*/*", icon: Paperclip },
];

function feedbackToolId(agentId?: string | null, outputType?: string): string | null {
  if (agentId?.startsWith("quicktool:")) return agentId.replace("quicktool:", "");
  if (outputType && outputType !== "chat") return outputType;
  return null;
}

function ModelFeedback({
  messageId,
  sessionId,
  agentId,
  outputType,
  streaming,
}: {
  messageId: string;
  sessionId: string | null;
  agentId?: string | null;
  outputType?: string;
  streaming?: boolean;
}) {
  if (streaming || messageId.startsWith("temp-")) return null;
  return (
    <AnswerFeedbackButtons
      chatHistoryId={messageId}
      sessionId={sessionId}
      toolId={feedbackToolId(agentId, outputType)}
    />
  );
}

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
  /** 클라이언트 전용 — 실시간 스트리밍 중인 임시 말풍선인지 (DB에는 저장되지 않음) */
  streaming?: boolean;
  /** 클라이언트 전용 — 첫 델타 이후 스트림이 끊겨 중단된 채로 마무리됐는지 */
  interrupted?: boolean;
  agentId?: string | null;
}

interface StreamEvent {
  type: "status" | "delta" | "done" | "error";
  sessionId: string;
  key?: string;
  detail?: string;
  text?: string;
  message?: Msg | string;
  interrupted?: boolean;
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
  if (typeof window === "undefined") return false;
  const v = window.localStorage.getItem(PANEL_OPEN_KEY);
  if (v === null) return window.matchMedia("(min-width: 768px)").matches;
  return v !== "0";
}

function buildArtifacts(messages: Msg[], t: (key: AppDictKey) => string): ChatArtifact[] {
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
      let title = m.fileName || t("artifact.presentation");
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
      let title = m.fileName || t("artifact.spreadsheet");
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
    } else if (m.outputType === "image") {
      list.push({
        id: `${m.id}-image`,
        kind: "image",
        title: m.fileName || t("artifact.image"),
        subtitle: "PNG",
        url: m.fileUrl,
        fileName: m.fileName,
        messageId: m.id,
      });
    } else if (m.outputType === "structured" && m.structuredKind) {
      let title: string = m.structuredKind;
      try {
        if (m.resultData) title = JSON.parse(m.resultData)?.title || title;
      } catch {
        /* ignore */
      }
      list.push({
        id: `${m.id}-struct`,
        kind: "structured",
        title,
        subtitle: t("artifact.structuredResult"),
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
        title: titleFromName || titleFromText || t("artifact.document"),
        subtitle: m.fileName || (m.outputType === "markdown" ? "Markdown / Word" : t("artifact.documentResponse")),
        url: m.fileUrl,
        fileName: m.fileName,
        messageId: m.id,
      });
    }
  }
  return list.reverse();
}

export default function ChatWorkspace({
  sessionId,
  onSessionCreated,
  onTurnSaved,
  onOpenBookChat,
}: {
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
  onTurnSaved: () => void;
  onOpenBookChat: (sessionId: string) => void;
}) {
  const t = useT();
  const uiLang = useAppLanguage();
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin === true;
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [error, setError] = useState("");
  const [activeQuickTool, setActiveQuickTool] = useState<ToolDef | null>(null);
  const [noteFormat, setNoteFormat] = useState<"markdown" | "pdf" | "image">("markdown");
  const [translateTarget, setTranslateTarget] = useState<AppLanguage>("en");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachAccept, setAttachAccept] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  const kbRef = useRef<HTMLDivElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const abortRef = useRef<AbortController | null>(null);
  const streamIdSeq = useRef(0);

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
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (
        quickActionsOpen &&
        quickActionsRef.current &&
        !quickActionsRef.current.contains(target)
      ) {
        setQuickActionsOpen(false);
      }
      if (kbOpen && kbRef.current && !kbRef.current.contains(target)) {
        setKbOpen(false);
      }
      if (attachMenuOpen && attachMenuRef.current && !attachMenuRef.current.contains(target)) {
        setAttachMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [quickActionsOpen, kbOpen, attachMenuOpen]);

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
      if (f.size > MAX_UPLOAD_BYTES) {
        setError(`${f.name}: ${t("chat.fileTooLarge")}`);
        continue;
      }
      added.push({ file: f, previewUrl: URL.createObjectURL(f) });
    }
    setPending((p) => [...p, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function runGeneration(buildForm: () => FormData, opts: { spokenTurn?: boolean } = {}) {
    const spokenTurn = !!opts.spokenTurn;
    setError("");
    setLoading(true);
    setStatusKey("status.agent.selecting");

    const controller = new AbortController();
    abortRef.current = controller;
    let streamMsgId: string | null = null;

    try {
      const form = buildForm();
      const res = await wsFetch("/api/chat", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? t("chat.errors.requestFailed"));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let newSessionId: string | null = null;
      let doneMessage: Msg | null = null;
      let doneInterrupted = false;
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
            if (key?.startsWith("status.route.verify")) setRefining(true);
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
          } else if (event.type === "delta") {
            const delta = event.text ?? "";
            if (!streamMsgId) {
              streamIdSeq.current += 1;
              streamMsgId = `stream-${streamIdSeq.current}`;
              setStreamingId(streamMsgId);
              const id = streamMsgId;
              setMessages((prev) => [...prev, { id, role: "model", text: delta, streaming: true }]);
            } else {
              const id = streamMsgId;
              setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, text: m.text + delta } : m)),
              );
            }
          } else if (event.type === "done") {
            doneMessage = event.message as Msg;
            doneInterrupted = !!event.interrupted;
          } else if (event.type === "error") {
            errorMessage = event.message as string;
          }
        }
      }

      if (errorMessage) {
        if (streamMsgId) {
          const id = streamMsgId;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, streaming: false, interrupted: true } : m)),
          );
        }
        throw new Error(errorMessage);
      }
      if (!sessionId && newSessionId) onSessionCreated(newSessionId);
      if (doneMessage && (doneMessage.text?.trim() || doneMessage.outputType)) {
        const finalMessage: Msg = { ...doneMessage, interrupted: doneInterrupted };
        if (streamMsgId) {
          const id = streamMsgId;
          setMessages((prev) => prev.map((m) => (m.id === id ? finalMessage : m)));
        } else {
          setMessages((prev) => [...prev, finalMessage]);
        }
        if (spokenTurn && doneMessage.text) speak(doneMessage.text);
        pushTerminal(doneInterrupted ? "done ✱ interrupted" : "done ✓ response ready", "ok");
        if (
          doneMessage.outputType === "pptx" ||
          doneMessage.outputType === "xlsx" ||
          doneMessage.outputType === "structured" ||
          doneMessage.outputType === "image"
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
      if (err instanceof DOMException && err.name === "AbortError") {
        if (streamMsgId) {
          const id = streamMsgId;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, streaming: false, interrupted: true } : m)),
          );
        }
        pushTerminal("stopped › user requested cancel", "info");
      } else {
        const msg = err instanceof Error ? err.message : t("common.unknownError");
        setError(msg);
        pushTerminal(`error ✗ ${msg}`, "error");
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
      setStatusKey(null);
      setStreamingId(null);
      setRefining(false);
    }
  }

  async function send(e?: React.FormEvent, spoken?: string) {
    e?.preventDefault();
    const spokenTurn = spoken !== undefined;
    let text = (spoken ?? draft).trim();
    // A4 노트 출력 형식 힌트를 본문에 주입
    if (!spokenTurn && activeQuickTool?.id === "note-a4") {
      text = text
        ? `${text}\n\n${t("chat.noteFormatLabel")} ${noteFormat}`
        : `${t("chat.noteFormatLabel")} ${noteFormat}\n${t("chat.noteFormatInstruction")}`;
    }
    // 번역 대상 언어 힌트를 본문에 주입
    if (!spokenTurn && activeQuickTool?.id === "doc-translate") {
      const targetLabel = LANGUAGE_LABELS[translateTarget];
      text = text
        ? `${t("chat.translateTargetLabel")} ${targetLabel}\n\n${text}`
        : `${t("chat.translateTargetLabel")} ${targetLabel}\n${t("chat.translateInstruction")}`;
    }
    const requiresAttachment =
      !spokenTurn && activeQuickTool != null && toolRequiresAttachment(activeQuickTool);
    if (spokenTurn && !text) return;
    if (!spokenTurn && ((!text && pending.length === 0) || loading)) return;
    if (requiresAttachment && pending.length === 0) return;
    // mixed/url: 텍스트·첨부 중 하나는 있어야 함 (위에서 이미 검사)

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
    }

    await runGeneration(
      () => {
        const form = new FormData();
        form.append("text", text);
        if (sessionId) form.append("sessionId", sessionId);
        if (quickToolId) form.append("quickToolId", quickToolId);
        for (const f of filesToUpload) form.append("files", f);
        return form;
      },
      { spokenTurn },
    );
  }

  /** 사용자 메시지 편집 — 그 메시지 이후 기록을 잘라내고 수정된 텍스트로 다시 생성한다. */
  async function submitEdit(id: string, newText: string) {
    const text = newText.trim();
    if (!text || loading || !sessionId) return;
    setEditingId(null);
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), { ...prev[idx], text }];
    });
    pushTerminal(`$ zeff edit — "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`, "info");
    await runGeneration(() => {
      const form = new FormData();
      form.append("text", text);
      form.append("sessionId", sessionId);
      form.append("editMessageId", id);
      return form;
    });
  }

  /** 마지막 assistant 응답 재생성 — 그 응답만 지우고 같은 질문으로 다시 생성한다. */
  async function regenerateLast() {
    if (loading || !sessionId) return;
    const idx = [...messages].reverse().findIndex((m) => m.role === "model");
    if (idx === -1) return;
    const cutAt = messages.length - 1 - idx;
    setMessages((prev) => prev.slice(0, cutAt));
    pushTerminal("$ zeff regenerate", "info");
    await runGeneration(() => {
      const form = new FormData();
      form.append("regenerate", "1");
      form.append("sessionId", sessionId);
      return form;
    });
  }

  function stopGeneration() {
    abortRef.current?.abort();
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

  const lastModelMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "model") return messages[i].id;
    }
    return null;
  }, [messages]);

  const artifacts = useMemo(() => buildArtifacts(messages, t), [messages, t]);

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
        <div className="mb-2 flex items-center justify-end md:hidden">
          <button
            type="button"
            onClick={() => setMobileSheet(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <PanelRight className="h-3.5 w-3.5" />
            {t("chat.workPanel")}
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
                {t("chat.emptyHint")}
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
                className="group flex justify-end gap-2.5"
              >
                {editingId === m.id ? (
                  <div className="max-w-[80%] flex-1 rounded-2xl rounded-tr-sm border border-blue-400 bg-white p-2 shadow-lg dark:border-blue-500 dark:bg-slate-900">
                    <textarea
                      autoFocus
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void submitEdit(m.id, editDraft);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      rows={Math.min(8, Math.max(2, editDraft.split("\n").length))}
                      className="w-full resize-none bg-transparent p-1 text-sm text-slate-800 outline-none dark:text-slate-100"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <X className="h-3 w-3" />
                        {t("chat.editCancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitEdit(m.id, editDraft)}
                        disabled={!editDraft.trim() || loading}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        {t("chat.editSave")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {!loading && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(m.id);
                          setEditDraft(m.text);
                        }}
                        title={t("chat.editMessage")}
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
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
                  </>
                )}
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
                    <ModelFeedback
                      messageId={m.id}
                      sessionId={sessionId}
                      agentId={m.agentId}
                      outputType={m.outputType}
                      streaming={m.streaming}
                    />
                  </div>
                ) : m.outputType === "image" && m.fileUrl ? (
                  <div className="min-w-0 max-w-[min(100%,28rem)] flex-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.fileUrl}
                      alt={m.text || t("artifact.image")}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm text-slate-600 dark:text-slate-300">{m.text}</p>
                      <a
                        href={m.fileUrl}
                        download={m.fileName || "image.png"}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <Download className="h-3 w-3" />
                        {t("chat.download")}
                      </a>
                    </div>
                    <ModelFeedback
                      messageId={m.id}
                      sessionId={sessionId}
                      agentId={m.agentId}
                      outputType={m.outputType}
                      streaming={m.streaming}
                    />
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
                    <ModelFeedback
                      messageId={m.id}
                      sessionId={sessionId}
                      agentId={m.agentId}
                      outputType={m.outputType}
                      streaming={m.streaming}
                    />
                  </div>
                ) : (
                  <div className="min-w-0 max-w-[min(100%,40rem)] flex-1">
                    <div className="prose-ai rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownCodeComponents}
                      >
                        {m.text}
                      </ReactMarkdown>
                      {!m.streaming && (
                        <CitationCards citations={parseCitationsFromResultData(m.resultData)} />
                      )}
                      {m.streaming && (
                        <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-slate-400 align-middle dark:bg-slate-500" />
                      )}
                    </div>
                    {m.streaming && m.id === streamingId && refining && (
                      <p className="mt-1.5 text-[11px] text-blue-600 dark:text-blue-300">
                        {t("chat.refining")}
                      </p>
                    )}
                    {m.interrupted && !m.streaming && (
                      <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                        {t("chat.interrupted")}
                      </p>
                    )}
                    {/* 짧은 답변: 복사만 / 긴 문서: 저장·인쇄 도구 */}
                    {!m.streaming && m.text && m.text.length > 0 && m.text.length <= 80 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <CopyButton text={m.text} />
                        {m.id === lastModelMessageId &&
                          (m.outputType === "chat" || !m.outputType) &&
                          !loading && (
                            <button
                              type="button"
                              onClick={() => void regenerateLast()}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                              title={t("chat.regenerate")}
                            >
                              <RotateCcw className="h-3 w-3" />
                              {t("chat.regenerate")}
                            </button>
                          )}
                      </div>
                    )}
                    {!m.streaming && m.text && m.text.length > 80 && (
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
                            {t("chat.saveMd")}
                          </a>
                        )}
                        <CopyButton text={m.text} />
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
                            openPrintableHtml(m.fileName ?? t("chat.zeffDocument"), m.text)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          title={t("chat.printToPdfTitle")}
                        >
                          <Printer className="h-3 w-3" />
                          {t("chat.printPdf")}
                        </button>
                        {m.id === lastModelMessageId &&
                          (m.outputType === "chat" || !m.outputType) &&
                          !loading && (
                            <button
                              type="button"
                              onClick={() => void regenerateLast()}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                              title={t("chat.regenerate")}
                            >
                              <RotateCcw className="h-3 w-3" />
                              {t("chat.regenerate")}
                            </button>
                          )}
                      </div>
                    )}
                    <ModelFeedback
                      messageId={m.id}
                      sessionId={sessionId}
                      agentId={m.agentId}
                      outputType={m.outputType}
                      streaming={m.streaming}
                    />
                  </div>
                )}
              </div>
            ),
          )}

          {/* AI 작업 중 — 응답이 시작되기 전에는 로고 스핀만 표시한다. */}
          {loading && !streamingId && (
            <div className="flex h-10 items-center">
              <Logo size="sm" withWordmark={false} spin />
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
                {toolUiLabel(activeQuickTool, t)}
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
                    {fmt === "markdown" ? "Markdown" : fmt === "pdf" ? t("chat.formatPdf") : t("chat.formatImage")}
                  </button>
                ))}
              {activeQuickTool.id === "doc-translate" && (
                <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {t("chat.translateTargetLabel")}
                  <select
                    value={translateTarget}
                    onChange={(e) => setTranslateTarget(e.target.value as AppLanguage)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {LANGUAGE_ORDER.map((lang) => (
                      <option key={lang} value={lang}>
                        {LANGUAGE_LABELS[lang]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {activeQuickTool.id === "video-summary" && (
                <span className="text-[11px] text-slate-500">
                  {t("quicktool.videoSummary.placeholder")}
                </span>
              )}
              {activeQuickTool.id === "exam-maker" && (
                <span className="text-[11px] text-slate-500">
                  {t("quicktool.examMaker.placeholder")}
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
              {listening ? (interim ? `“${interim}”` : t("chat.listening")) : t("chat.readingReply")}
            </div>
          )}

          <div className="flex items-end gap-1.5 sm:gap-2">
            <div ref={quickActionsRef} className="relative shrink-0">
              <motion.button
                type="button"
                onClick={() => {
                  setKbOpen(false);
                  setAttachMenuOpen(false);
                  setQuickActionsOpen((v) => !v);
                }}
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
                    className="absolute bottom-full left-0 z-20 mb-2 max-h-80 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 max-md:fixed max-md:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] max-md:left-3 max-md:right-3 max-md:w-auto dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-black/40 dark:backdrop-blur-md"
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

            <div ref={kbRef} className="relative shrink-0">
              <motion.button
                type="button"
                onClick={() => {
                  setQuickActionsOpen(false);
                  setAttachMenuOpen(false);
                  setKbOpen((v) => !v);
                }}
                disabled={loading}
                whileTap={{ scale: 0.96 }}
                title={t("sidebar.myLibrary")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition-colors hover:border-blue-500/50 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-blue-300"
              >
                <BookOpen className="h-5 w-5" />
              </motion.button>
              <KnowledgeBaseSheet
                open={kbOpen}
                onClose={() => setKbOpen(false)}
                onOpenBookChat={onOpenBookChat}
              />
            </div>

            <div ref={attachMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setQuickActionsOpen(false);
                  setKbOpen(false);
                  setAttachMenuOpen((v) => !v);
                }}
                disabled={loading}
                title={t("chat.attach")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition-colors hover:border-blue-500/50 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-blue-300"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <AnimatePresence>
                {attachMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute bottom-full left-0 z-20 mb-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl max-md:fixed max-md:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] max-md:left-3 max-md:right-3 max-md:w-auto dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-black/40"
                  >
                    {ATTACH_FORMATS.map(({ id, labelKey, accept, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setAttachAccept(accept);
                          setAttachMenuOpen(false);
                          window.setTimeout(() => fileRef.current?.click(), 0);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        {t(labelKey)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={attachAccept || toolAcceptAttr(activeQuickTool)}
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
              placeholder={
                activeQuickTool
                  ? getToolPlaceholder(activeQuickTool.id, uiLang, activeQuickTool.placeholder)
                  : t("chat.placeholder")
              }
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
                title={listening ? t("chat.stopListening") : speaking ? t("chat.stopReading") : t("chat.speak")}
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
              type={loading ? "button" : "submit"}
              onClick={loading ? stopGeneration : undefined}
              whileTap={{ scale: 0.95 }}
              disabled={loading ? false : !canSend}
              title={loading ? t("chat.stop") : t("chat.send")}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                loading
                  ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-600/30"
                  : "bg-gradient-to-r from-blue-600 to-indigo-500 shadow-blue-600/30"
              }`}
            >
              {loading ? <Square className="h-4 w-4" /> : <Send className="h-5 w-5" />}
            </motion.button>
          </div>
        </form>
      </div>

      {/* 드래그 리사이즈 핸들 */}
      {panelOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t("chat.resizeArea")}
          onMouseDown={startResize}
          className="group relative z-20 w-1.5 shrink-0 cursor-col-resize bg-transparent"
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200 transition-colors group-hover:bg-blue-500 group-active:bg-blue-600 dark:bg-slate-700 dark:group-hover:bg-blue-400" />
          <div className="absolute top-1/2 left-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-600" />
        </div>
      )}

      {/* 우측 작업 패널 */}
      <div
        className="hidden h-full shrink-0 md:block"
        style={panelOpen ? { width: panelWidth } : undefined}
      >
        <ChatRightPanel
          open={panelOpen}
          onToggle={togglePanel}
          tab={panelTab}
          onTabChange={setPanelTab}
          artifacts={artifacts}
          terminalLines={terminalLines}
          loading={loading}
          onSelectArtifact={openArtifact}
          isAdmin={isAdmin}
        />
      </div>

      {/* 모바일: 시트로만 열림 (데스크톱 panelOpen 과 분리) */}
      <AnimatePresence>
        {mobileSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
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
                terminalLines={terminalLines}
                loading={loading}
                onSelectArtifact={(a) => {
                  openArtifact(a);
                  setMobileSheet(false);
                }}
                isAdmin={isAdmin}
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
                  <>
                    <a
                      href={previewArtifact.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                    >
                      {t("chat.openNewTab")}
                    </a>
                    <a
                      href={previewArtifact.url}
                      download={previewArtifact.fileName ?? undefined}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("chat.download")}
                    </a>
                  </>
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
  const t = useT();
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
        <p>{t("chat.attachmentPreview")}</p>
        <a href={artifact.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          {t("chat.openNewTab")}
        </a>
      </div>
    );
  }
  if (artifact.kind === "image" && artifact.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={artifact.url} alt={artifact.title} className="max-h-[70vh] w-full rounded-xl object-contain" />
    );
  }
  if ((artifact.kind === "pptx" || artifact.kind === "xlsx") && msg?.resultData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;
    try {
      data = JSON.parse(msg.resultData);
    } catch {
      data = null;
    }
    if (data) {
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
    }
  }
  if (artifact.kind === "structured" && msg?.resultData && msg.structuredKind) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = null;
    let parseFailed = false;
    try {
      parsed = JSON.parse(msg.resultData);
    } catch {
      parseFailed = true;
    }
    if (parseFailed) {
      return (
        <pre className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950">
          {msg.resultData}
        </pre>
      );
    }
    // structuredKind 문자열 → 뷰 매핑 (런타임 안전)
    return (
      <StructuredResultView
        id={msg.id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({ kind: msg.structuredKind, data: parsed } as any)}
      />
    );
  }
  if (msg?.text) {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownCodeComponents}
        >
          {msg.text}
        </ReactMarkdown>
      </div>
    );
  }
  if (artifact.url) {
    return (
      <iframe title={artifact.title} src={artifact.url} className="h-[70vh] w-full rounded-xl border border-slate-200 dark:border-slate-700" />
    );
  }
  return <p className="text-sm text-slate-500">{t("chat.noPreview")}</p>;
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
