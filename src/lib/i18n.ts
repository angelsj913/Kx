"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  LANGUAGE_LABELS,
  LANGUAGE_ORDER,
  type AppLanguage,
} from "./languages";

export type { AppLanguage };
export { LANGUAGE_LABELS, LANGUAGE_ORDER };

const STORAGE_KEY = "zeff-app-language";
const DEFAULT_LANGUAGE: AppLanguage = "ko";

let cache: AppLanguage | null = null;
const listeners = new Set<() => void>();

function isAppLanguage(v: string | null): v is AppLanguage {
  return !!v && (LANGUAGE_ORDER as string[]).includes(v);
}

function read(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (isAppLanguage(raw)) return raw;
    // 홈 언어 키도 공유 (결제창 동기화)
    const landing = window.localStorage.getItem("zeff-landing-language");
    if (isAppLanguage(landing)) return landing;
    return DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function getSnapshot(): AppLanguage {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): AppLanguage {
  return DEFAULT_LANGUAGE;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 서버(UserSettings) 반영이 끝난 뒤에만 호출해서 전역 언어를 실제로 갈아입힌다. */
export function setAppLanguage(lang: AppLanguage) {
  cache = lang;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      // 홈/결제창과 동기화
      window.localStorage.setItem("zeff-landing-language", lang);
    } catch {
      /* ignore quota errors */
    }
  }
  listeners.forEach((l) => l());
}

export function useAppLanguage(): AppLanguage {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 베이스 딕셔너리 — ko / en 완전 번역. 기타 언어는 en 폴백. */
const KO = {
  "sidebar.newChat": "새 채팅",
  "sidebar.myLibrary": "내 서재",
  "sidebar.sharedLibrary": "공유 서재",
  "sidebar.library": "라이브러리",
  "sidebar.libraryEmpty": "아직 대화가 없어요.",

  "library.title": "내 서재",
  "library.sharedTitle": "공유 서재",
  "library.subtitle": "책이나 문서를 올려두면 내용을 기억해서 Book Chat으로 대화할 수 있어요.",
  "library.sharedSubtitle": "팀 워크스페이스 멤버가 함께 쓰는 문서 서재입니다.",
  "library.upload": "문서 올리기",
  "library.uploading": "업로드하는 중...",
  "library.empty": "아직 서재에 담아둔 문서가 없어요.",
  "library.sharedEmpty": "공유 서재에 문서가 없어요. 팀 워크스페이스를 선택하고 올려 보세요.",
  "library.needWorkspace": "공유 서재를 쓰려면 팀 워크스페이스를 만들거나 전환해 주세요.",
  "library.tab.mine": "내 서재",
  "library.tab.shared": "공유 서재",
  "library.bookChat": "Book Chat",
  "library.delete": "삭제",
  "library.deleteConfirm": "이 문서를 서재에서 삭제할까요?",
  "sidebar.plan.free": "free 플랜",
  "sidebar.plan.pro": "프로",
  "sidebar.plan.professional": "프로페셔널",

  "profile.settings": "설정",
  "profile.logout": "로그아웃",

  "settings.title": "설정",
  "settings.tab.features": "기능",
  "settings.tab.plan": "요금제",
  "settings.tab.language": "언어",
  "settings.features.office": "직장인 기능",
  "settings.features.student": "학생 도구",
  "settings.plan.current": "현재 플랜",
  "settings.plan.select": "선택",
  "settings.plan.note": "결제 완료 시 선택한 요금제 권한이 자동으로 적용됩니다.",
  "settings.language.label": "언어",
  "settings.language.apply": "변경",
  "settings.language.hint": "워크스페이스 UI 언어 (홈페이지와 동일 종류)",

  "chat.placeholder": "무엇이든 물어보세요...  (Enter 전송 · Shift+Enter 줄바꿈)",
  "chat.attach": "이미지·문서 첨부",
  "chat.quickActions": "빠른 작업",
  "chat.quickActions.office": "직장인 기능",
  "chat.quickActions.student": "학생 도구",
  "chat.empty": "무엇이든 물어보세요. 이미지나 문서를 첨부할 수도 있어요.",
  "chat.send": "보내기",
  "chat.copy": "복사",
  "chat.copied": "복사됨",
  "chat.openFile": "열기",
  "chat.download": "다운로드",
  "chat.preview": "미리보기",
  "chat.closePreview": "닫기",

  "feature.create": "문서 · 파일",
  "feature.learn": "학습 · 시험",
  "feature.media": "음성 · 강의",

  "quicktool.bizdoc.label": "문서 작성",
  "quicktool.word-doc.label": "워드",
  "quicktool.ppt.label": "PPT",
  "quicktool.excel.label": "엑셀",
  "quicktool.doc-convert.label": "문서 변환",
  "quicktool.note-a4.label": "A4 노트",
  "quicktool.video-summary.label": "영상 요약",
  "quicktool.lecture.label": "강의 영상 요약",
  "quicktool.lecture-notes.label": "강의 노트",
  "quicktool.math-solve.label": "수학 풀이",
  "quicktool.exam-analysis.label": "시험지 분석",
  "quicktool.exam-similarity.label": "유사도 분석",
  "quicktool.similar-problems.label": "유사문제 생성",
  "quicktool.exam-maker.label": "시험지 제작",
  "quicktool.presentation.label": "과제 작성",
  "quicktool.research-draft.label": "논문",
  "quicktool.audio.label": "음성 정리",
  "quicktool.lecture-chat.label": "강의 채팅",

  "status.agent.selecting": "에이전트를 고르는 중...",
  "status.agent.selected": "에이전트가 답변을 준비하는 중...",
  "status.route.start": "백엔드 라우트 시작...",
  "status.route.classify": "요청 분류 · 전문 에이전트 선정...",
  "status.route.generate": "전문 에이전트가 답변 생성 중...",
  "status.route.generate.try": "모델 시도 중...",
  "status.route.verify.light": "경량 정밀 검토 중...",
  "status.route.verify.deep": "심층 정밀 검증 중...",
  "status.route.complete": "라우트 완료",
  "status.route.complete.refined": "정밀 검증 반영 · 완료",
  "status.ai.trying": "AI 검수 중...",
  "status.quicktool.generating": "내용을 구성하는 중...",
  "status.file.uploading": "파일 업로드하는 중...",

  "billing.receipt": "영수증",
  "billing.orderDetail": "주문 상세",
  "billing.print": "인쇄",
  "billing.close": "닫기",
  "billing.merchantUid": "주문번호",
  "billing.plan": "요금제",
  "billing.amount": "금액",
  "billing.status": "상태",
  "billing.date": "결제일",

  "common.save": "저장",
  "common.cancel": "취소",
  "common.delete": "삭제",
  "common.loading": "불러오는 중...",
  "common.savingIndicator": "저장 중...",
  "common.saveFailed": "저장 실패",
} as const;

const EN: Record<keyof typeof KO, string> = {
  "sidebar.newChat": "New chat",
  "sidebar.myLibrary": "My Library",
  "sidebar.sharedLibrary": "Shared Library",
  "sidebar.library": "Library",
  "sidebar.libraryEmpty": "No conversations yet.",

  "library.title": "My Library",
  "library.sharedTitle": "Shared Library",
  "library.subtitle": "Upload books or documents and chat with them anytime via Book Chat.",
  "library.sharedSubtitle": "Documents shared with your team workspace members.",
  "library.upload": "Upload document",
  "library.uploading": "Uploading...",
  "library.empty": "No documents in your library yet.",
  "library.sharedEmpty": "No documents in the shared library. Select a team workspace and upload.",
  "library.needWorkspace": "Switch to or create a team workspace to use the shared library.",
  "library.tab.mine": "My Library",
  "library.tab.shared": "Shared",
  "library.bookChat": "Book Chat",
  "library.delete": "Delete",
  "library.deleteConfirm": "Remove this document from your library?",
  "sidebar.plan.free": "Free plan",
  "sidebar.plan.pro": "Pro",
  "sidebar.plan.professional": "Professional",

  "profile.settings": "Settings",
  "profile.logout": "Log out",

  "settings.title": "Settings",
  "settings.tab.features": "Features",
  "settings.tab.plan": "Plan",
  "settings.tab.language": "Language",
  "settings.features.office": "Work tools",
  "settings.features.student": "Student tools",
  "settings.plan.current": "Current plan",
  "settings.plan.select": "Select",
  "settings.plan.note": "Your plan is applied automatically after payment is confirmed.",
  "settings.language.label": "Language",
  "settings.language.apply": "Apply",
  "settings.language.hint": "Workspace UI language (same options as homepage)",

  "chat.placeholder": "Ask me anything...  (Enter to send · Shift+Enter for new line)",
  "chat.attach": "Attach image or document",
  "chat.quickActions": "Quick actions",
  "chat.quickActions.office": "Work tools",
  "chat.quickActions.student": "Student tools",
  "chat.empty": "Ask me anything. You can attach images or documents too.",
  "chat.send": "Send",
  "chat.copy": "Copy",
  "chat.copied": "Copied",
  "chat.openFile": "Open",
  "chat.download": "Download",
  "chat.preview": "Preview",
  "chat.closePreview": "Close",

  "feature.create": "Docs · Files",
  "feature.learn": "Study · Exams",
  "feature.media": "Audio · Lectures",

  "quicktool.bizdoc.label": "Document",
  "quicktool.word-doc.label": "Word",
  "quicktool.ppt.label": "PPT",
  "quicktool.excel.label": "Spreadsheet",
  "quicktool.doc-convert.label": "Convert document",
  "quicktool.note-a4.label": "A4 notes",
  "quicktool.video-summary.label": "Video summary",
  "quicktool.lecture.label": "Lecture summary",
  "quicktool.lecture-notes.label": "Lecture notes",
  "quicktool.math-solve.label": "Math solver",
  "quicktool.exam-analysis.label": "Exam analysis",
  "quicktool.exam-similarity.label": "Exam similarity",
  "quicktool.similar-problems.label": "Practice set",
  "quicktool.exam-maker.label": "Exam maker",
  "quicktool.presentation.label": "Assignment",
  "quicktool.research-draft.label": "Research paper",
  "quicktool.audio.label": "Audio notes",
  "quicktool.lecture-chat.label": "Lecture chat",

  "status.agent.selecting": "Choosing an agent...",
  "status.agent.selected": "Agent is preparing a reply...",
  "status.route.start": "Starting backend route...",
  "status.route.classify": "Classifying request · picking specialist...",
  "status.route.generate": "Specialist generating answer...",
  "status.route.generate.try": "Trying model...",
  "status.route.verify.light": "Light precision review...",
  "status.route.verify.deep": "Deep precision verification...",
  "status.route.complete": "Route complete",
  "status.route.complete.refined": "Verified · complete",
  "status.ai.trying": "Reviewing with AI...",
  "status.quicktool.generating": "Putting the content together...",
  "status.file.uploading": "Uploading file...",

  "billing.receipt": "Receipt",
  "billing.orderDetail": "Order detail",
  "billing.print": "Print",
  "billing.close": "Close",
  "billing.merchantUid": "Order ID",
  "billing.plan": "Plan",
  "billing.amount": "Amount",
  "billing.status": "Status",
  "billing.date": "Date",

  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.loading": "Loading...",
  "common.savingIndicator": "Saving...",
  "common.saveFailed": "Save failed",
};

export type AppDictKey = keyof typeof KO;

const DICT: Record<"ko" | "en", Record<AppDictKey, string>> = {
  ko: { ...KO },
  en: EN,
};

function resolveDict(lang: AppLanguage): Record<AppDictKey, string> {
  if (lang === "ko") return DICT.ko;
  // 나머지 7개 언어는 en 폴백 (UI 언어 선택은 8종 모두 가능)
  return DICT.en;
}

export function useT() {
  const language = useAppLanguage();
  return useCallback(
    (key: AppDictKey) => {
      const dict = resolveDict(language);
      return dict[key] ?? DICT.en[key] ?? DICT.ko[key] ?? key;
    },
    [language],
  );
}

/** 퀵툴 라벨 — 번역 키 누락 시 tool.label 폴백 (`.label` 키 노출 방지) */
export function toolUiLabel(
  tool: { id: string; label: string; short?: string },
  t: (key: AppDictKey) => string,
): string {
  const key = `quicktool.${tool.id}.label` as AppDictKey;
  const translated = t(key);
  if (
    !translated ||
    translated === key ||
    translated.endsWith(".label") ||
    translated.startsWith("quicktool.")
  ) {
    return tool.label || tool.short || tool.id;
  }
  return translated;
}

export function featureGroupLabel(
  groupId: string,
  fallback: string,
  t: (key: AppDictKey) => string,
): string {
  const map: Record<string, AppDictKey> = {
    create: "feature.create",
    learn: "feature.learn",
    media: "feature.media",
  };
  const key = map[groupId];
  if (!key) return fallback;
  return t(key);
}
