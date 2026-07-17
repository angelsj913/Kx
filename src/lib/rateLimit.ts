import { prisma } from "./prisma";

export class RateLimitError extends Error {
  constructor(message = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.") {
    super(message);
    this.name = "RateLimitError";
  }
}

function windowKeyFor(windowSeconds: number): string {
  return String(Math.floor(Date.now() / 1000 / windowSeconds));
}

/** 요청 헤더에서 클라이언트 IP를 뽑는다(Vercel은 x-forwarded-for를 붙여준다). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * 고정 윈도우 rate limit. 초과 시 RateLimitError를 던진다.
 * 쿼터 예약(usage.ts)과 달리 실패한 시도도 그대로 카운트에 남긴다 — 여기서 막으려는
 * 대상 자체가 "틀린 시도(잘못된 비밀번호·인증번호)를 계속 반복하는 것"이기 때문에,
 * 실패했다고 자리를 돌려주면 방어 의미가 없다.
 */
export async function assertRateLimit(
  scope: string,
  identifier: string,
  opts: { max: number; windowSeconds: number },
): Promise<void> {
  const windowKey = windowKeyFor(opts.windowSeconds);
  const row = await prisma.rateLimitHit.upsert({
    where: { scope_identifier_windowKey: { scope, identifier, windowKey } },
    create: { scope, identifier, windowKey, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (row.count > opts.max) {
    throw new RateLimitError();
  }
}

/**
 * 예외 대신 boolean으로 결과를 돌려주는 버전 — NextAuth의 Credentials.authorize처럼
 * 커스텀 예외를 던지기보다 null 반환으로 실패를 표현해야 하는 자리에서 쓴다.
 */
export async function checkRateLimit(
  scope: string,
  identifier: string,
  opts: { max: number; windowSeconds: number },
): Promise<boolean> {
  try {
    await assertRateLimit(scope, identifier, opts);
    return true;
  } catch (err) {
    if (err instanceof RateLimitError) return false;
    throw err;
  }
}
