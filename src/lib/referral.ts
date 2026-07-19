/**
 * 친구 추천(리퍼럴) — 추천 성사 시 추천인·피추천인 양쪽에 "Pro 7일"을 한시 부여한다.
 * 한시 부여는 UserSettings.grantedPlan/grantedPlanUntil 로 저장되고, 실제 권한 판정은
 * usage.ts 의 getUserPlanId 한 곳에서 유료 plan 과 비교해 더 높은 쪽을 적용한다.
 */
import { prisma } from "@/lib/prisma";

export const REFERRAL_REWARD_DAYS = 7;

/** 사람이 읽고 입력하기 쉬운 8자리 코드(혼동 문자 O/0/I/1/L 제외). */
function randomCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

/** 사용자의 고유 추천 코드를 반환(없으면 충돌 없는 코드를 생성해 저장). */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      // unique 충돌 시 재시도. 그사이 다른 요청이 코드를 심었으면 그 값을 사용.
      const again = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });
      if (again?.referralCode) return again.referralCode;
    }
  }
  throw new Error("추천 코드를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
}

/** grantedPlanUntil 을 현재 기준 +days 만큼 연장(이미 미래면 그 위에 누적). */
function extendedUntil(current: Date | null, days: number): Date {
  const base = current && current.getTime() > Date.now() ? current.getTime() : Date.now();
  return new Date(base + days * 24 * 60 * 60 * 1000);
}

async function grantProDays(userId: string, days: number): Promise<void> {
  const s = await prisma.userSettings.findUnique({
    where: { userId },
    select: { grantedPlanUntil: true },
  });
  const until = extendedUntil(s?.grantedPlanUntil ?? null, days);
  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, grantedPlan: "pro", grantedPlanUntil: until },
    update: { grantedPlan: "pro", grantedPlanUntil: until },
  });
}

export type RedeemResult =
  | { ok: true; rewardDays: number }
  | { ok: false; error: string };

/**
 * 피추천인(userId)이 추천 코드(code)를 입력했을 때의 처리.
 * 남용 방지: 자기 코드 불가 · 이메일 인증 완료자만 · 피추천인당 1회만.
 */
export async function redeemReferral(userId: string, codeRaw: string): Promise<RedeemResult> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { ok: false, error: "추천 코드를 입력해 주세요." };

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, emailVerified: true },
  });
  if (!me) return { ok: false, error: "로그인이 필요합니다." };
  // 계정 존재 여부·자동가입 남용을 막기 위해 이메일 인증 완료자만 보상 대상.
  if (!me.emailVerified) {
    return { ok: false, error: "이메일 인증을 완료한 뒤 추천 코드를 입력할 수 있어요." };
  }
  if (me.referralCode && me.referralCode === code) {
    return { ok: false, error: "본인의 추천 코드는 사용할 수 없습니다." };
  }

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });
  if (!referrer) return { ok: false, error: "존재하지 않는 추천 코드입니다." };
  if (referrer.id === userId) {
    return { ok: false, error: "본인의 추천 코드는 사용할 수 없습니다." };
  }

  // 피추천인당 1회 — 이미 추천을 받았으면 거절.
  const already = await prisma.referral.findUnique({ where: { referredUserId: userId } });
  if (already) return { ok: false, error: "이미 추천 코드를 사용했습니다." };

  await prisma.referral.create({
    data: { referrerId: referrer.id, referredUserId: userId },
  });
  await Promise.all([
    grantProDays(referrer.id, REFERRAL_REWARD_DAYS),
    grantProDays(userId, REFERRAL_REWARD_DAYS),
  ]);

  return { ok: true, rewardDays: REFERRAL_REWARD_DAYS };
}

/** 추천 현황(내 코드·성사 건수·현재 부여된 Pro 만료일). */
export async function getReferralStatus(userId: string) {
  const code = await getOrCreateReferralCode(userId);
  const [count, settings] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.userSettings.findUnique({
      where: { userId },
      select: { grantedPlan: true, grantedPlanUntil: true },
    }),
  ]);
  const activeGrant =
    settings?.grantedPlan && settings.grantedPlanUntil && settings.grantedPlanUntil.getTime() > Date.now()
      ? { plan: settings.grantedPlan, until: settings.grantedPlanUntil }
      : null;
  return { code, referredCount: count, activeGrant };
}
