import { prisma } from "@/lib/prisma";
import { featureForTool, getPlanOrFree, type PlanId } from "@/lib/plans";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** 월 키 YYYY-MM */
export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** ISO 주 키 YYYY-Www */
export function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad(week)}`;
}

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

async function getUserPlanId(userId: string): Promise<PlanId> {
  const s = await prisma.userSettings.findUnique({ where: { userId } });
  const plan = s?.plan;
  if (plan === "pro" || plan === "professional" || plan === "free") return plan;
  return "free";
}

/**
 * 원자적으로 카운터를 +1 하고 나서 한도를 확인한다 — "조회 후 증가"의 반대 순서다.
 * Postgres의 단일 UPDATE(count = count + 1)는 행 단위로 직렬화되므로, 두 동시 요청은
 * 서로 다른(순차적인) count 값을 받게 되어 트랜잭션 없이도 경쟁 조건이 사라진다.
 * 한도를 넘으면 방금 늘린 값을 즉시 되돌리고(보상) ok:false를 반환한다.
 */
async function reserveQuota(
  userId: string,
  feature: string,
  periodKey: string,
  max: number,
): Promise<{ ok: boolean }> {
  const row = await prisma.usageCounter.upsert({
    where: { userId_feature_periodKey: { userId, feature, periodKey } },
    create: { userId, feature, periodKey, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (row.count > max) {
    await prisma.usageCounter.update({
      where: { userId_feature_periodKey: { userId, feature, periodKey } },
      data: { count: { decrement: 1 } },
    });
    return { ok: false };
  }
  return { ok: true };
}

/** 생성이 실패로 끝났을 때, 이미 소비한 카운터를 되돌린다. 0 미만으로는 내려가지 않는다. */
export async function refundQuota(
  userId: string,
  feature: string,
  periodKey: string,
): Promise<void> {
  await prisma.usageCounter.updateMany({
    where: { userId, feature, periodKey, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

async function getCount(userId: string, feature: string, periodKey: string): Promise<number> {
  const row = await prisma.usageCounter.findUnique({
    where: { userId_feature_periodKey: { userId, feature, periodKey } },
  });
  return row?.count ?? 0;
}

export interface QuotaConsumption {
  planId: PlanId;
  feature: string;
  /** 실제로 카운터를 소비했다면 그 식별자 — 생성 실패 시 refundQuota로 되돌릴 때 쓴다.
   * null이면 소비한 카운터가 없다(무제한 플랜, 동시 세션 검사만 통과한 경우 등). */
  consumed: { feature: string; periodKey: string } | null;
}

/**
 * 채팅/퀵툴 실행 전 쿼터 검사 후 카운트 +1.
 * 초과 시 QuotaError. 반환값의 `consumed`는 생성이 실패했을 때 호출부가
 * refundQuota로 되돌릴 수 있도록 어떤 카운터를 소비했는지 알려준다.
 */
export async function assertAndConsumeQuota(
  userId: string,
  quickToolId: string | null,
  opts?: { isNewSession?: boolean },
): Promise<QuotaConsumption> {
  const planId = await getUserPlanId(userId);
  const plan = getPlanOrFree(planId);
  const feature = featureForTool(quickToolId);

  if (opts?.isNewSession) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const active = await prisma.chatSession.count({
      where: { userId, updatedAt: { gte: since } },
    });
    if (active >= plan.concurrentSessions) {
      throw new QuotaError(
        `동시 세션 한도(${plan.concurrentSessions}개)를 초과했습니다. ${plan.name} 플랜을 확인해 주세요.`,
      );
    }
  }

  if (feature === "pptx" || feature === "xlsx") {
    const periodKey = plan.pptxXlsxLimit.period === "week" ? weekKey() : monthKey();
    const result = await reserveQuota(userId, "pptx-xlsx", periodKey, plan.pptxXlsxLimit.max);
    if (!result.ok) {
      const unit = plan.pptxXlsxLimit.period === "week" ? "주" : "월";
      throw new QuotaError(
        `PPT·엑셀 생성 한도(${unit} ${plan.pptxXlsxLimit.max}회)에 도달했습니다.`,
      );
    }
    return { planId, feature, consumed: { feature: "pptx-xlsx", periodKey } };
  }

  if (feature === "exam-analysis") {
    if (plan.examAnalysisMonthly == null) {
      throw new QuotaError("시험지 분석은 Pro 이상 플랜에서 이용할 수 있습니다.");
    }
    const periodKey = monthKey();
    const result = await reserveQuota(userId, feature, periodKey, plan.examAnalysisMonthly);
    if (!result.ok) {
      throw new QuotaError(`시험지 분석 월 한도(${plan.examAnalysisMonthly}회)에 도달했습니다.`);
    }
    return { planId, feature, consumed: { feature, periodKey } };
  }

  if (feature === "similar-problems") {
    if (plan.similarProblemsMonthly == null) {
      throw new QuotaError("유사 문제 생성은 Pro 이상 플랜에서 이용할 수 있습니다.");
    }
    const periodKey = monthKey();
    const result = await reserveQuota(userId, feature, periodKey, plan.similarProblemsMonthly);
    if (!result.ok) {
      throw new QuotaError(`유사 문제 생성 월 한도(${plan.similarProblemsMonthly}회)에 도달했습니다.`);
    }
    return { planId, feature, consumed: { feature, periodKey } };
  }

  if (feature === "exam-maker") {
    if (plan.examMakerMonthly == null) {
      throw new QuotaError("시험지 제작은 Pro 이상 플랜에서 이용할 수 있습니다.");
    }
    const periodKey = monthKey();
    const result = await reserveQuota(userId, feature, periodKey, plan.examMakerMonthly);
    if (!result.ok) {
      throw new QuotaError(`시험지 제작 월 한도(${plan.examMakerMonthly}회)에 도달했습니다.`);
    }
    return { planId, feature, consumed: { feature, periodKey } };
  }

  // 일반 문서/채팅
  if (plan.monthlyDocuments != null) {
    const periodKey = monthKey();
    const result = await reserveQuota(userId, "document", periodKey, plan.monthlyDocuments);
    if (!result.ok) {
      throw new QuotaError(`월 문서 작성 한도(${plan.monthlyDocuments}회)에 도달했습니다.`);
    }
    return { planId, feature, consumed: { feature: "document", periodKey } };
  }

  return { planId, feature, consumed: null };
}

export async function getUsageSummary(userId: string) {
  const planId = await getUserPlanId(userId);
  const plan = getPlanOrFree(planId);
  const mk = monthKey();
  const wk = weekKey();
  const [doc, file, exam, sim, maker] = await Promise.all([
    getCount(userId, "document", mk),
    getCount(userId, "pptx-xlsx", plan.pptxXlsxLimit.period === "week" ? wk : mk),
    getCount(userId, "exam-analysis", mk),
    getCount(userId, "similar-problems", mk),
    getCount(userId, "exam-maker", mk),
  ]);
  return {
    planId,
    plan,
    usage: {
      document: { used: doc, max: plan.monthlyDocuments },
      pptxXlsx: { used: file, max: plan.pptxXlsxLimit.max, period: plan.pptxXlsxLimit.period },
      examAnalysis: { used: exam, max: plan.examAnalysisMonthly },
      similarProblems: { used: sim, max: plan.similarProblemsMonthly },
      examMaker: { used: maker, max: plan.examMakerMonthly },
    },
  };
}
