import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 활동 시각 갱신 (24h throttle). 휴면 계정이면 재로그인 시 active 복귀.
 */
export async function touchUserActivity(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveAt: true, accountStatus: true },
    });
    if (!user) return;

    const now = new Date();
    const last = user.lastActiveAt?.getTime() ?? 0;
    const stale = now.getTime() - last > DAY_MS;
    const wasDormant = user.accountStatus === "dormant";

    if (!stale && !wasDormant) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: now,
        ...(wasDormant
          ? {
              accountStatus: "active",
              dormantAt: null,
              dormantNotifiedAt: null,
            }
          : {}),
      },
    });
  } catch (err) {
    console.warn("[activity] touch failed", err);
  }
}
