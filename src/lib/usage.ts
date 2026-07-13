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

async function getCount(userId: string, feature: string, periodKey: string): Promise<number> {
  const row = await prisma.usageCounter.findUnique({
    where: { userId_feature_periodKey: { userId, feature, periodKey } },
  });
  return row?.count ?? 0;
}

async function bump(userId: string, feature: string, periodKey: string): Promise<void> {
  await prisma.usageCounter.upsert({
    where: { userId_feature_periodKey: { userId, feature, periodKey } },
    create: { userId, feature, periodKey, count: 1 },
    update: { count: { increment: 1 } },
  });
}

/**
 * 채팅/퀵툴 실행 전 쿼터 검사 후 카운트 +1.
 * 초과 시 QuotaError.
 */
export async function assertAndConsumeQuota(
  userId: string,
  quickToolId: string | null,
  opts?: { isNewSession?: boolean },
) {
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
    const periodKey =
      plan.pptxXlsxLimit.period === "week" ? weekKey() : monthKey();
    const used = await getCount(userId, "pptx-xlsx", periodKey);
    if (used >= plan.pptxXlsxLimit.max) {
      const unit = plan.pptxXlsxLimit.period === "week" ? "주" : "월";
      throw new QuotaError(
        `PPT·엑셀 생성 한도(${unit} ${plan.pptxXlsxLimit.max}회)에 도달했습니다.`,
      );
    }
    await bump(userId, "pptx-xlsx", periodKey);
    return { planId, feature };
  }

  if (feature === "exam-analysis") {
    if (plan.examAnalysisMonthly == null) {
      throw new QuotaError("시험지 분석은 Pro 이상 플랜에서 이용할 수 있습니다.");
    }
    const used = await getCount(userId, feature, monthKey());
    if (used >= plan.examAnalysisMonthly) {
      throw new QuotaError(`시험지 분석 월 한도(${plan.examAnalysisMonthly}회)에 도달했습니다.`);
    }
    await bump(userId, feature, monthKey());
    return { planId, feature };
  }

  if (feature === "similar-problems") {
    if (plan.similarProblemsMonthly == null) {
      throw new QuotaError("유사 문제 생성은 Pro 이상 플랜에서 이용할 수 있습니다.");
    }
    const used = await getCount(userId, feature, monthKey());
    if (used >= plan.similarProblemsMonthly) {
      throw new QuotaError(`유사 문제 생성 월 한도(${plan.similarProblemsMonthly}회)에 도달했습니다.`);
    }
    await bump(userId, feature, monthKey());
    return { planId, feature };
  }

  if (feature === "exam-maker") {
    if (plan.examMakerMonthly == null) {
      throw new QuotaError("시험지 제작은 Pro 이상 플랜에서 이용할 수 있습니다.");
    }
    const used = await getCount(userId, feature, monthKey());
    if (used >= plan.examMakerMonthly) {
      throw new QuotaError(`시험지 제작 월 한도(${plan.examMakerMonthly}회)에 도달했습니다.`);
    }
    await bump(userId, feature, monthKey());
    return { planId, feature };
  }

  // 일반 문서/채팅
  if (plan.monthlyDocuments != null) {
    const used = await getCount(userId, "document", monthKey());
    if (used >= plan.monthlyDocuments) {
      throw new QuotaError(`월 문서 작성 한도(${plan.monthlyDocuments}회)에 도달했습니다.`);
    }
    await bump(userId, "document", monthKey());
  }

  return { planId, feature };
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
