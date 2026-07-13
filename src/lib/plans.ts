/**
 * 요금제 단일 소스 — 설정 UI · 홈 Pricing · 서버 쿼터 검사에서 공유.
 */
export type PlanId = "free" | "pro" | "professional";

export interface PlanDef {
  id: PlanId;
  name: string;
  /** checkout / Stripe 표시명 */
  label: string;
  /** KRW 원 단위 (zero-decimal) */
  amount: number;
  currency: string;
  priceLabel: string;
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
    name: "Free",
    label: "Free",
    amount: 0,
    currency: "krw",
    priceLabel: "₩0",
    periodLabel: "/월",
    description: "개인이 가볍게 시작하기 좋은 기본 플랜",
    bullets: [
      "월 20회 문서 작성",
      "동시 세션 1개",
      "표준 모델 사용",
      "PPT · 엑셀 변환 주 1회",
      "기본 서재 저장",
      "이메일 지원",
    ],
    monthlyDocuments: 20,
    concurrentSessions: 1,
    pptxXlsxLimit: { period: "week", max: 1 },
    libraryMax: 20,
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
    amount: 12900,
    currency: "krw",
    priceLabel: "₩12,900",
    periodLabel: "/월",
    description: "업무·학습을 본격적으로 돌리는 실무 플랜",
    bullets: [
      "PPT · 엑셀 생성 월 20회",
      "우선 처리 큐 배정",
      "내 서재 파일 100개",
      "상위 모델 제한적 사용",
      "문서 생성 확대",
      "이메일 우선 지원",
    ],
    monthlyDocuments: 200,
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
    amount: 23900,
    currency: "krw",
    priceLabel: "₩23,900",
    periodLabel: "/월",
    description: "최상위 라우트와 시험 기능을 쓰는 프리미엄 플랜",
    bullets: [
      "최상위 멀티 AI 백엔드 라우트",
      "시험지 분석 월 25회",
      "유사 문제 생성 월 25회",
      "시험지 제작 포함",
      "무제한에 가까운 문서 쿼터",
      "전담 지원 채널",
    ],
    monthlyDocuments: 2000,
    concurrentSessions: 20,
    pptxXlsxLimit: { period: "month", max: 200 },
    libraryMax: 1000,
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
