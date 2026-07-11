"use client";

import { useCallback, useSyncExternalStore } from "react";

export type AppLanguage = "ko" | "en";

const STORAGE_KEY = "zeff-app-language";
const DEFAULT_LANGUAGE: AppLanguage = "ko";

let cache: AppLanguage | null = null;
const listeners = new Set<() => void>();

function read(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "ko" || raw === "en" ? raw : DEFAULT_LANGUAGE;
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
    } catch {
      /* ignore quota errors */
    }
  }
  listeners.forEach((l) => l());
}

export function useAppLanguage(): AppLanguage {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const DICT = {
  ko: {
    "sidebar.newChat": "새 채팅",
    "sidebar.myLibrary": "내 서재",
    "sidebar.library": "라이브러리",
    "sidebar.libraryEmpty": "아직 대화가 없어요.",

    "library.title": "내 서재",
    "library.subtitle": "책이나 문서를 올려두면 내용을 기억해서 Book Chat으로 대화할 수 있어요.",
    "library.upload": "문서 올리기",
    "library.uploading": "업로드하는 중...",
    "library.empty": "아직 서재에 담아둔 문서가 없어요.",
    "library.bookChat": "Book Chat",
    "library.delete": "삭제",
    "library.deleteConfirm": "이 문서를 서재에서 삭제할까요?",
    "sidebar.plan.free": "무료 플랜",
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
    "settings.plan.note": "테스트용 전환입니다. 실제 결제는 연동되어 있지 않습니다.",
    "settings.language.label": "언어",
    "settings.language.apply": "변경",

    "chat.placeholder": "무엇이든 물어보세요...  (Enter 전송 · Shift+Enter 줄바꿈)",
    "chat.attach": "이미지·문서 첨부",
    "chat.quickActions": "빠른 작업",
    "chat.quickActions.office": "직장인 기능",
    "chat.quickActions.student": "학생 도구",
    "chat.empty": "무엇이든 물어보세요. 이미지나 문서를 첨부할 수도 있어요.",
    "chat.send": "보내기",

    "quicktool.bizdoc.label": "문서 작성",
    "quicktool.ppt.label": "PPT",
    "quicktool.excel.label": "엑셀",
    "quicktool.lecture.label": "강의 영상 요약",
    "quicktool.presentation.label": "과제 작성",
    "quicktool.research-draft.label": "논문",
    "quicktool.exam-analysis.label": "시험지 분석",
    "quicktool.exam-similarity.label": "유사도 분석",
    "quicktool.doc-convert.label": "문서 변환",
    "quicktool.similar-problems.label": "유사문제 생성",
    "quicktool.lecture-chat.label": "강의 채팅",

    "status.agent.selecting": "에이전트를 고르는 중...",
    "status.agent.selected": "에이전트가 답변을 준비하는 중...",
    "status.ai.trying": "AI 검수 중...",
    "status.quicktool.generating": "내용을 구성하는 중...",
    "status.file.uploading": "파일 업로드하는 중...",

    "common.save": "저장",
    "common.cancel": "취소",
    "common.delete": "삭제",
    "common.loading": "불러오는 중...",
    "common.savingIndicator": "저장 중...",
    "common.saveFailed": "저장 실패",
  },
  en: {
    "sidebar.newChat": "New chat",
    "sidebar.myLibrary": "My Library",
    "sidebar.library": "Library",
    "sidebar.libraryEmpty": "No conversations yet.",

    "library.title": "My Library",
    "library.subtitle": "Upload books or documents and chat with them anytime via Book Chat.",
    "library.upload": "Upload document",
    "library.uploading": "Uploading...",
    "library.empty": "No documents in your library yet.",
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
    "settings.plan.note": "This is a test-only switch. No real billing is connected.",
    "settings.language.label": "Language",
    "settings.language.apply": "Apply",

    "chat.placeholder": "Ask me anything...  (Enter to send · Shift+Enter for new line)",
    "chat.attach": "Attach image or document",
    "chat.quickActions": "Quick actions",
    "chat.quickActions.office": "Work tools",
    "chat.quickActions.student": "Student tools",
    "chat.empty": "Ask me anything. You can attach images or documents too.",
    "chat.send": "Send",

    "quicktool.bizdoc.label": "Document",
    "quicktool.ppt.label": "PPT",
    "quicktool.excel.label": "Spreadsheet",
    "quicktool.lecture.label": "Lecture summary",
    "quicktool.presentation.label": "Assignment",
    "quicktool.research-draft.label": "Research paper",
    "quicktool.exam-analysis.label": "Exam analysis",
    "quicktool.exam-similarity.label": "Exam similarity",
    "quicktool.doc-convert.label": "Convert document",
    "quicktool.similar-problems.label": "Generate practice set",
    "quicktool.lecture-chat.label": "Lecture chat",

    "status.agent.selecting": "Choosing an agent...",
    "status.agent.selected": "Agent is preparing a reply...",
    "status.ai.trying": "Reviewing with AI...",
    "status.quicktool.generating": "Putting the content together...",
    "status.file.uploading": "Uploading file...",

    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.loading": "Loading...",
    "common.savingIndicator": "Saving...",
    "common.saveFailed": "Save failed",
  },
} as const;

export type AppDictKey = keyof (typeof DICT)["ko"];

export function useT() {
  const language = useAppLanguage();
  return useCallback((key: AppDictKey) => DICT[language][key] ?? key, [language]);
}
