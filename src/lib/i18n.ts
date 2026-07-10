import { useSyncExternalStore } from "react";

export type Language = "ko" | "en";

const KEY = "zeff-language";
const DEFAULT: Language = "ko";

const DICT: Record<Language, Record<string, string>> = {
  ko: {
    "sidebar.newChat": "새 채팅",
    "sidebar.library": "라이브러리",
    "sidebar.libraryEmpty": "아직 대화가 없어요",
    "sidebar.deleteSession": "삭제",
    "plan.free": "무료 플랜",
    "plan.pro": "프로",
    "plan.professional": "프로페셔널",
    "chat.placeholder": "무엇이든 물어보세요...",
    "chat.emptyTitle": "무엇을 도와드릴까요?",
    "chat.emptyDesc": "질문, 문서 작성, 자료 요약까지 zeff에게 편하게 물어보세요.",
    "chat.send": "전송",
    "chat.attach": "파일 첨부",
    "chat.addTools": "기능 추가",
    "chat.groupOffice": "직장인 기능",
    "chat.groupStudent": "학생 도구",
    "tool.bizdoc": "문서 작성",
    "tool.ppt": "PPT",
    "tool.excel": "엑셀",
    "tool.lecture": "강의 영상 요약",
    "tool.assignment": "과제 작성",
    "tool.paper": "논문",
    "agent.reasoning": "추론 에이전트",
    "agent.research": "리서치 에이전트",
    "agent.writing": "라이팅 에이전트",
    "status.filesChecking": "첨부한 파일을 확인하는 중...",
    "status.analyzing": "질문을 분석하는 중...",
    "status.agentWorking": "{agent}가 답변을 준비하는 중...",
    "status.failover": "다른 에이전트로 이어받는 중...",
    "status.saving": "답변을 저장하는 중...",
    "error.noReply": "지금은 답변을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
    "profile.settings": "설정",
    "profile.plan": "요금제",
    "profile.help": "도움",
    "profile.logout": "로그아웃",
    "profile.comingSoon": "준비 중",
    "settings.tab.general": "일반",
    "settings.tab.account": "계정",
    "settings.tab.privacy": "개인정보 보호",
    "settings.tab.billing": "결제",
    "settings.tab.features": "기능",
    "settings.tab.shortcuts": "단축키",
    "settings.tab.language": "언어",
    "settings.language.title": "표시 언어",
    "settings.language.desc": "현재 {lang}로 표시되고 있어요.",
    "settings.language.apply": "변경",
    "settings.language.applied": "언어가 변경되었어요.",
    "settings.features.title": "퀵툴 관리",
    "settings.features.desc": "채팅 입력창의 '기능 추가' 메뉴에 표시할 항목을 선택하세요.",
    "common.close": "닫기",
    "common.edit": "수정",
    "common.view": "보기",
    "common.manage": "관리",
    "common.dangerZone": "위험 구역",
    "common.user": "사용자",
    "lang.ko": "한국어",
    "lang.en": "English",
    "settings.general.profileSection": "프로필",
    "settings.general.profileRow": "이름·아바타",
    "settings.general.profileDesc": "표시 이름과 프로필 사진을 관리해요.",
    "settings.general.prefSection": "환경설정",
    "settings.general.theme": "테마",
    "settings.general.themeDesc": "다크 모드로 고정되어 있어요.",
    "settings.account.infoSection": "내 계정 정보",
    "settings.account.passwordRow": "비밀번호 변경",
    "settings.account.passwordDesc": "구글 계정으로만 로그인 중이라면 해당 없음. 추후 웹사이트에서 연결됩니다.",
    "settings.account.allDevicesRow": "모든 기기에서 로그아웃",
    "settings.account.allDevicesDesc": "이 계정으로 로그인된 다른 모든 기기에서 세션을 종료해요.",
    "settings.account.deleteRow": "계정 탈퇴",
    "settings.account.deleteDesc": "모든 대화 기록과 생성물이 영구적으로 삭제돼요.",
    "settings.account.deleteButton": "탈퇴",
    "settings.privacy.termsSection": "약관",
    "settings.privacy.policyRow": "개인정보처리방침",
    "settings.privacy.dataSection": "데이터",
    "settings.privacy.dataRow": "데이터 및 메모리 관리",
    "settings.privacy.dataDesc": "대화 기록, 생성 결과물, 저장된 파일을 한 번에 관리해요.",
    "settings.billing.infoSection": "결제 정보",
    "settings.billing.methodRow": "결제 수단",
    "settings.billing.methodDesc": "등록된 결제 수단이 없어요.",
    "settings.billing.register": "등록",
    "settings.billing.invoiceRow": "청구서",
    "settings.billing.invoiceDesc": "지난 청구 내역을 확인해요.",
    "settings.billing.nextRow": "다음 청구일 / 금액",
    "settings.billing.nextDesc": "무료 플랜 사용 중 — 청구 예정 없음",
    "settings.billing.cancelRow": "결제수단 해지",
    "settings.billing.cancel": "해지",
    "settings.shortcuts.section": "자주 쓰는 동작",
    "settings.shortcuts.newChat": "새 대화",
    "settings.shortcuts.send": "메시지 전송",
    "settings.shortcuts.openSettings": "설정 열기",
  },
  en: {
    "sidebar.newChat": "New chat",
    "sidebar.library": "Library",
    "sidebar.libraryEmpty": "No conversations yet",
    "sidebar.deleteSession": "Delete",
    "plan.free": "Free plan",
    "plan.pro": "Pro",
    "plan.professional": "Professional",
    "chat.placeholder": "Ask anything...",
    "chat.emptyTitle": "How can I help?",
    "chat.emptyDesc": "Ask zeff anything — questions, writing, or summarizing documents.",
    "chat.send": "Send",
    "chat.attach": "Attach file",
    "chat.addTools": "Add tools",
    "chat.groupOffice": "Work tools",
    "chat.groupStudent": "Student tools",
    "tool.bizdoc": "Document",
    "tool.ppt": "Slides",
    "tool.excel": "Spreadsheet",
    "tool.lecture": "Lecture summary",
    "tool.assignment": "Assignment",
    "tool.paper": "Paper",
    "agent.reasoning": "Reasoning agent",
    "agent.research": "Research agent",
    "agent.writing": "Writing agent",
    "status.filesChecking": "Checking attached files...",
    "status.analyzing": "Analyzing your question...",
    "status.agentWorking": "{agent} is preparing a response...",
    "status.failover": "Handing off to another agent...",
    "status.saving": "Saving the response...",
    "error.noReply": "Couldn't generate a response right now. Please try again shortly.",
    "profile.settings": "Settings",
    "profile.plan": "Plan",
    "profile.help": "Help",
    "profile.logout": "Log out",
    "profile.comingSoon": "Coming soon",
    "settings.tab.general": "General",
    "settings.tab.account": "Account",
    "settings.tab.privacy": "Privacy",
    "settings.tab.billing": "Billing",
    "settings.tab.features": "Features",
    "settings.tab.shortcuts": "Shortcuts",
    "settings.tab.language": "Language",
    "settings.language.title": "Display language",
    "settings.language.desc": "Currently displayed in {lang}.",
    "settings.language.apply": "Change",
    "settings.language.applied": "Language updated.",
    "settings.features.title": "Quick tools",
    "settings.features.desc": "Choose which items appear in the composer's \"Add tools\" menu.",
    "common.close": "Close",
    "common.edit": "Edit",
    "common.view": "View",
    "common.manage": "Manage",
    "common.dangerZone": "Danger zone",
    "common.user": "User",
    "lang.ko": "한국어",
    "lang.en": "English",
    "settings.general.profileSection": "Profile",
    "settings.general.profileRow": "Name & avatar",
    "settings.general.profileDesc": "Manage your display name and profile photo.",
    "settings.general.prefSection": "Preferences",
    "settings.general.theme": "Theme",
    "settings.general.themeDesc": "Currently locked to dark mode.",
    "settings.account.infoSection": "Account info",
    "settings.account.passwordRow": "Change password",
    "settings.account.passwordDesc": "Not applicable if you only sign in with Google. Coming soon on the website.",
    "settings.account.allDevicesRow": "Log out of all devices",
    "settings.account.allDevicesDesc": "End every session signed in with this account on other devices.",
    "settings.account.deleteRow": "Delete account",
    "settings.account.deleteDesc": "All conversations and generated content will be permanently deleted.",
    "settings.account.deleteButton": "Delete",
    "settings.privacy.termsSection": "Terms",
    "settings.privacy.policyRow": "Privacy policy",
    "settings.privacy.dataSection": "Data",
    "settings.privacy.dataRow": "Data & memory management",
    "settings.privacy.dataDesc": "Manage conversation history, generated results, and stored files in one place.",
    "settings.billing.infoSection": "Billing info",
    "settings.billing.methodRow": "Payment method",
    "settings.billing.methodDesc": "No payment method on file.",
    "settings.billing.register": "Add",
    "settings.billing.invoiceRow": "Invoices",
    "settings.billing.invoiceDesc": "Review your past billing history.",
    "settings.billing.nextRow": "Next billing date / amount",
    "settings.billing.nextDesc": "On the free plan — nothing scheduled",
    "settings.billing.cancelRow": "Cancel payment method",
    "settings.billing.cancel": "Cancel",
    "settings.shortcuts.section": "Common actions",
    "settings.shortcuts.newChat": "New chat",
    "settings.shortcuts.send": "Send message",
    "settings.shortcuts.openSettings": "Open settings",
  },
};

let cache: Language | null = null;
const listeners = new Set<() => void>();

function read(): Language {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "en" || raw === "ko" ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function getSnapshot(): Language {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): Language {
  return DEFAULT;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 화면에 즉시 반영만 한다 — 서버 저장은 호출부(설정 모달의 "변경" 버튼)에서 별도로 처리한다. */
export function setLanguage(lang: Language) {
  cache = lang;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, lang);
    } catch {
      /* ignore quota errors */
    }
  }
  listeners.forEach((l) => l());
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function translate(lang: Language, key: string, params?: Record<string, string>): string {
  let text = DICT[lang][key] ?? DICT.ko[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

/** 컴포넌트 안에서 `const t = useT();`로 받아 `t("sidebar.newChat")` 형태로 쓴다.
 * 언어가 바뀌면(useLanguage 구독) 자동으로 리렌더되어 실시간 번역처럼 동작한다. */
export function useT() {
  const lang = useLanguage();
  return (key: string, params?: Record<string, string>) => translate(lang, key, params);
}
