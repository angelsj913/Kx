/**
 * 요금제 단일 소스 — 설정 UI · 홈 Pricing · 서버 쿼터 검사에서 공유.
 */
export type PlanId = "free" | "pro" | "professional";

export interface PlanDef {
  id: PlanId;
  name: string;
  /** checkout / Stripe 표시명 */
  label: string;
  /** KRW 원 단위 (zero-decimal) — 월간 결제액 */
  amount: number;
  /** 연간 결제액(원). 2개월 무료 관행 = 월×10. free/미지원은 null. */
  annualAmount: number | null;
  currency: string;
  priceLabel: string;
  /** 연간 표시가 (예: "₩99,000"). 없으면 null. */
  annualPriceLabel: string | null;
  periodLabel: string;
  description: string;
  bullets: string[];
  /** 월 문서/채팅 생성 상한 (null = 플랜 정책상 별도) */
  monthlyDocuments: number | null;
  /** 동시 활성 세션 */
  concurrentSessions: number;
  /** PPT/엑셀: free=주 1, pro=월 20, professional=월 여유 */
  pptxXlsxLimit: { period: "week" | "month"; max: number };
  /** 서재 파일 상한 */
  libraryMax: number;
  /** 시험지 분석 / 유사문제 월 상한 (null = 미제공) */
  examAnalysisMonthly: number | null;
  similarProblemsMonthly: number | null;
  /** 시험지 제작 월 상한 */
  examMakerMonthly: number | null;
  /** 모델 티어 */
  modelTier: "standard" | "priority" | "top";
  /** 우선 처리 큐 */
  priorityQueue: boolean;
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "free",
    label: "free",
    amount: 0,
    annualAmount: null,
    currency: "krw",
    priceLabel: "₩0",
    annualPriceLabel: null,
    periodLabel: "/월",
    description: "가볍게 시작해 보는 기본 플랜",
    bullets: [
      "기본 AI 채팅",
      "월 5회 문서 생성",
      "PPT · 엑셀 체험 (주 1회)",
      "표준 모델 사용",
      "동시 세션 1개",
      "서재 저장 5개",
    ],
    monthlyDocuments: 5,
    concurrentSessions: 1,
    pptxXlsxLimit: { period: "week", max: 1 },
    libraryMax: 5,
    examAnalysisMonthly: null,
    similarProblemsMonthly: null,
    examMakerMonthly: null,
    modelTier: "standard",
    priorityQueue: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    label: "Pro",
    amount: 9900,
    annualAmount: 99000,
    currency: "krw",
    priceLabel: "₩9,900",
    annualPriceLabel: "₩99,000",
    periodLabel: "/월",
    description: "업무·학습을 본격적으로 돌리는 실무 플랜",
    bullets: [
      "실무에 맞춘 확장 작업 환경",
      "무료 대비 약 30배 이용량",
      "우선 처리 큐 배정",
      "더 강력한 AI 모델 우선 사용",
      "PPT · 엑셀 · 문서 생성",
      "내 서재 저장 공간 확장",
      "이메일 우선 지원",
    ],
    monthlyDocuments: 150,
    concurrentSessions: 5,
    pptxXlsxLimit: { period: "month", max: 20 },
    libraryMax: 100,
    examAnalysisMonthly: 5,
    similarProblemsMonthly: 5,
    examMakerMonthly: 10,
    modelTier: "priority",
    priorityQueue: true,
  },
  professional: {
    id: "professional",
    name: "Professional",
    label: "Professional",
    amount: 14900,
    annualAmount: 149000,
    currency: "krw",
    priceLabel: "₩14,900",
    annualPriceLabel: "₩149,000",
    periodLabel: "/월",
    description: "정밀 라우트와 시험 기능을 쓰는 프리미엄 플랜",
    bullets: [
      "Pro 기능 + 확장 한도",
      "무료 대비 약 100배 이용량",
      "최상급 AI 모델 우선 사용 + 정밀 검수",
      "시험지 분석 · 유사문제 생성 확대 한도",
      "전담 지원 채널",
      "신규 기능 우선 체험",
      "팀 계정 연동 (준비 중)",
    ],
    monthlyDocuments: 500,
    concurrentSessions: 20,
    pptxXlsxLimit: { period: "month", max: 100 },
    libraryMax: 500,
    examAnalysisMonthly: 25,
    similarProblemsMonthly: 25,
    examMakerMonthly: 25,
    modelTier: "top",
    priorityQueue: true,
  },
};

export function isPlanId(v: unknown): v is PlanId {
  return v === "free" || v === "pro" || v === "professional";
}

/** checkout 등 — free는 결제 대상 아님, 없으면 undefined */
export function getPlan(id: string | null | undefined): PlanDef | undefined {
  if (!id || !isPlanId(id)) return undefined;
  if (id === "free") return undefined;
  return PLANS[id];
}

export function getPlanOrFree(id: string | null | undefined): PlanDef {
  if (isPlanId(id)) return PLANS[id];
  return PLANS.free;
}

/** 고유 주문번호(Merchant UID) 발행 */
export function newMerchantUid(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ZEFF-${Date.now()}-${rand}`;
}

/** 퀵툴 id → 쿼터 feature 키 */
export function featureForTool(toolId: string | null | undefined): string {
  if (!toolId || toolId === "chat") return "document";
  if (toolId === "ppt" || toolId === "presentation" || toolId === "pptx") return "pptx";
  if (toolId === "excel" || toolId === "xlsx") return "xlsx";
  if (toolId === "exam-analysis") return "exam-analysis";
  if (toolId === "similar-problems" || toolId === "exam-similarity") return "similar-problems";
  if (toolId === "exam-maker") return "exam-maker";
  return "document";
}
