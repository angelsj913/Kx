import type { AppLanguage } from "./i18n";

type CheckoutDict = {
  preparing: string;
  subscribe: string;
  perMonth: string;
  orderSummary: string;
  stubNote: string;
  completeSim: string;
  moving: string;
  canceled: string;
  retry: string;
  unknownPlan: string;
  prepareFail: string;
};

const KO: CheckoutDict = {
  preparing: "결제창을 준비하는 중...",
  subscribe: "구독",
  perMonth: "/ 월",
  orderSummary: "주문 요약",
  stubNote:
    "결제 플랫폼 연동 전입니다. 아래 버튼으로 결제 완료를 시뮬레이션하면 선택한 요금제 권한이 계정에 자동 부여됩니다.",
  completeSim: "결제 완료 처리하기",
  moving: "이동 중…",
  canceled: "결제가 취소되었습니다.",
  retry: "다시 시도",
  unknownPlan: "알 수 없는 요금제입니다.",
  prepareFail: "결제 준비에 실패했습니다.",
};

const EN: CheckoutDict = {
  preparing: "Preparing checkout...",
  subscribe: "Subscribe",
  perMonth: "/ mo",
  orderSummary: "Order summary",
  stubNote:
    "Payment platform is not fully connected yet. Completing below will simulate payment and apply the plan to your account.",
  completeSim: "Complete payment (simulate)",
  moving: "Redirecting…",
  canceled: "Payment was canceled.",
  retry: "Try again",
  unknownPlan: "Unknown plan.",
  prepareFail: "Failed to prepare checkout.",
};

export function getCheckoutT(lang: AppLanguage | string | null | undefined): CheckoutDict {
  if (lang === "ko") return KO;
  return EN;
}

export function readCheckoutLanguage(): AppLanguage {
  if (typeof window === "undefined") return "ko";
  try {
    const app = window.localStorage.getItem("zeff-app-language");
    const landing = window.localStorage.getItem("zeff-landing-language");
    const v = app || landing || "ko";
    const allowed = ["en", "ko", "ja", "zh", "ru", "de", "fr", "es"];
    return (allowed.includes(v) ? v : "ko") as AppLanguage;
  } catch {
    return "ko";
  }
}
