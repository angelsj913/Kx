"use client";

import { useCallback, useSyncExternalStore } from "react";

export type LandingLanguage = "ko" | "en";

const STORAGE_KEY = "zeff-landing-language";
const DEFAULT_LANGUAGE: LandingLanguage = "ko";

let cache: LandingLanguage | null = null;
const listeners = new Set<() => void>();

function read(): LandingLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "ko" || raw === "en" ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function getSnapshot(): LandingLanguage {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): LandingLanguage {
  return DEFAULT_LANGUAGE;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setLandingLanguage(lang: LandingLanguage) {
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

export function useLandingLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { language, setLanguage: setLandingLanguage };
}

const DICT = {
  ko: {
    "nav.about": "회사소개",
    "nav.potential": "발전 가능성",
    "nav.prototype": "개발중인 프로토타입",
    "nav.download": "다운로드",
    "nav.support": "지원창",
    "header.support": "지원",
    "header.login": "로그인",

    "hero.badge": "차세대 AI 워크스페이스",
    "hero.title.line1": "생각의 속도로",
    "hero.title.line2": "일하는 AI, zeff",
    "hero.subtitle":
      "zeff AI는 복잡한 작업을 가장 빠른 방식으로 끝내는 개인용 AI 워크스페이스입니다. 지금 다운로드하고 바로 경험해보세요.",
    "hero.download.windows": "윈도우 다운",
    "hero.download.mac": "맥 다운",
    "hero.download.note": "Windows 10/11 (64-bit) 및 macOS 지원",
    "hero.modal.windowsTitle": "Windows 버전 다운로드",
    "hero.modal.macTitle": "Mac 버전 다운로드",
    "hero.modal.windowsNote": "Windows 10/11 (64-bit)용 설치 파일(.exe)",
    "hero.modal.macNote": "macOS용 설치 파일(.dmg)",
    "hero.modal.instruction": "내려받은 파일을 실행하고 화면 안내를 따라 설치하세요.",
    "hero.modal.confirm": "설치 파일 받기",
    "hero.modal.cancel": "취소",

    "techdemo.title": "엄청나게 빠른 AI",
    "techdemo.subtitle":
      "고난도 수학 문제를 풀이하고 결과물을 완성하는 zeff AI의 실제 처리 과정을 확인해보세요.",
    "techdemo.video1": "수학 문제 풀이 데모",
    "techdemo.video2": "결과물 생성 데모",
    "techdemo.videoPlaceholder": "영상 준비 중",
    "techdemo.feature1.title": "압도적인 처리 속도",
    "techdemo.feature1.desc":
      "복잡한 수식과 논리 연산도 지연 없이 실시간으로 풀어냅니다.",
    "techdemo.feature2.title": "정확한 결과물",
    "techdemo.feature2.desc":
      "풀이 과정과 최종 결과물을 함께 제공해 신뢰할 수 있는 답을 제공합니다.",
    "techdemo.feature3.title": "끊김 없는 경험",
    "techdemo.feature3.desc":
      "어떤 환경에서도 안정적으로 동작하는 반응형 AI 엔진을 사용합니다.",

    "pricing.title": "요금제",
    "pricing.subtitle": "필요에 맞는 플랜을 선택하세요.",
    "pricing.free.name": "무료",
    "pricing.free.desc": "zeff AI를 가볍게 체험해볼 수 있는 플랜입니다.",
    "pricing.free.price": "₩0",
    "pricing.free.period": "/ 월",
    "pricing.free.cta": "결제하기",
    "pricing.pro.name": "Pro",
    "pricing.pro.badge": "무료 대비 30배 쿼터",
    "pricing.pro.desc": "더 많은 작업량이 필요한 사용자를 위한 플랜입니다.",
    "pricing.pro.price": "₩9,900",
    "pricing.pro.period": "/ 월",
    "pricing.pro.cta": "결제하기",
    "pricing.professional.name": "프로페셔널",
    "pricing.professional.badge1": "무료 대비 150배 초대용량 쿼터",
    "pricing.professional.badge2": "가장 좋은 모델 사용 허가",
    "pricing.professional.desc": "가장 강력한 모델을 무제한에 가깝게 사용합니다.",
    "pricing.professional.price": "₩19,900",
    "pricing.professional.period": "/ 월",
    "pricing.professional.cta": "결제하기",

    "footer.privacy": "개인정보 처리방침",
    "footer.brand": "zeff AI",
    "footer.contact": "문의",
    "footer.ceo": "대표",

    "contact.title": "문의하기",
    "contact.desc": "궁금하신 점이나 제안하고 싶은 내용이 있다면 아래 이메일로 연락해주세요.",
    "contact.close": "닫기",
  },
  en: {
    "nav.about": "About",
    "nav.potential": "Potential",
    "nav.prototype": "Prototypes in Development",
    "nav.download": "Download",
    "nav.support": "Support",
    "header.support": "Support",
    "header.login": "Log in",

    "hero.badge": "Next-generation AI workspace",
    "hero.title.line1": "AI that works",
    "hero.title.line2": "at the speed of thought",
    "hero.subtitle":
      "zeff AI is a personal AI workspace built to finish complex work the fastest way possible. Download it now and experience it yourself.",
    "hero.download.windows": "Download for Windows",
    "hero.download.mac": "Download for Mac",
    "hero.download.note": "Supports Windows 10/11 (64-bit) and macOS",
    "hero.modal.windowsTitle": "Download for Windows",
    "hero.modal.macTitle": "Download for Mac",
    "hero.modal.windowsNote": "Installer (.exe) for Windows 10/11 (64-bit)",
    "hero.modal.macNote": "Installer (.dmg) for macOS",
    "hero.modal.instruction": "Run the downloaded file and follow the on-screen instructions.",
    "hero.modal.confirm": "Get installer",
    "hero.modal.cancel": "Cancel",

    "techdemo.title": "Ridiculously fast AI",
    "techdemo.subtitle":
      "See how zeff AI actually solves advanced math problems and produces results.",
    "techdemo.video1": "Math problem-solving demo",
    "techdemo.video2": "Output generation demo",
    "techdemo.videoPlaceholder": "Video coming soon",
    "techdemo.feature1.title": "Overwhelming speed",
    "techdemo.feature1.desc":
      "Solves complex equations and logic in real time, without delay.",
    "techdemo.feature2.title": "Accurate results",
    "techdemo.feature2.desc":
      "Provides both the reasoning process and the final output so you can trust the answer.",
    "techdemo.feature3.title": "Seamless experience",
    "techdemo.feature3.desc":
      "Powered by a responsive AI engine that runs reliably in any environment.",

    "pricing.title": "Pricing",
    "pricing.subtitle": "Choose the plan that fits your needs.",
    "pricing.free.name": "Free",
    "pricing.free.desc": "A light plan to try out zeff AI.",
    "pricing.free.price": "$0",
    "pricing.free.period": "/ mo",
    "pricing.free.cta": "Subscribe",
    "pricing.pro.name": "Pro",
    "pricing.pro.badge": "30x the quota of Free",
    "pricing.pro.desc": "For users who need more capacity.",
    "pricing.pro.price": "$7.99",
    "pricing.pro.period": "/ mo",
    "pricing.pro.cta": "Subscribe",
    "pricing.professional.name": "Professional",
    "pricing.professional.badge1": "150x massive quota of Free",
    "pricing.professional.badge2": "Access to the best model",
    "pricing.professional.desc": "Near-unlimited access to our most powerful model.",
    "pricing.professional.price": "$15.99",
    "pricing.professional.period": "/ mo",
    "pricing.professional.cta": "Subscribe",

    "footer.privacy": "Privacy Policy",
    "footer.brand": "zeff AI",
    "footer.contact": "Contact",
    "footer.ceo": "CEO",

    "contact.title": "Contact us",
    "contact.desc": "If you have any questions or suggestions, please reach out at the email below.",
    "contact.close": "Close",
  },
} as const;

export type LandingDictKey = keyof (typeof DICT)["ko"];

export function useLandingT() {
  const { language } = useLandingLanguage();
  return useCallback((key: LandingDictKey) => DICT[language][key], [language]);
}
