/**
 * Paymentwall Digital Goods (구독) 연동.
 *
 * 서명·URL 형식은 공식 Node 라이브러리(paymentwall/paymentwall-node) 소스를 기준으로 했다:
 * - lib/Config.js       WIDGET_BASE_URL, GOODS_CONTROLLER, DEFAULT_SIGNATURE_VERSION
 * - lib/Signature/*.js  파라미터 알파벳 정렬 → "key=value" 무구분자 연결 → 시크릿 덧붙임 → 해시
 *
 * 서버 전용 — 시크릿 키를 읽으므로 클라이언트 컴포넌트에서 import 하지 말 것.
 */
import crypto from "crypto";
import { PLANS, type PlanId } from "@/lib/plans";

/** 공식 라이브러리 Config.js: WIDGET_BASE_URL + '/' + GOODS_CONTROLLER */
const WIDGET_URL = "https://api.paymentwall.com/api/subscription";

/** Config.js DEFAULT_SIGNATURE_VERSION = 3 (SHA256). 2는 MD5로 레거시다. */
const SIGN_VERSION = 3;

export type BillingInterval = "month" | "year";

export type PaymentwallConfig = {
  projectKey: string;
  secretKey: string;
  widgetCode: string;
};

/** 세 값이 모두 있어야 결제가 가능하다. 하나라도 비면 null — 호출부가 503으로 막는다. */
export function getPaymentwallConfig(): PaymentwallConfig | null {
  const projectKey = process.env.PAYMENTWALL_PROJECT_KEY?.trim();
  const secretKey = process.env.PAYMENTWALL_SECRET_KEY?.trim();
  const widgetCode = process.env.PAYMENTWALL_WIDGET_CODE?.trim();
  if (!projectKey || !secretKey || !widgetCode) return null;
  return { projectKey, secretKey, widgetCode };
}

type SignParams = Record<string, string | number | undefined | null>;

/**
 * 파라미터를 이름 알파벳 순으로 정렬해 "key=value" 를 구분자 없이 이어 붙이고,
 * 끝에 시크릿 키를 붙여 해시한다. 공식 라이브러리와 동일하게 빈 값은 "" 로 다룬다.
 */
export function calculateSignature(
  params: SignParams,
  secret: string,
  version: number = SIGN_VERSION,
): string {
  const base = Object.keys(params)
    .sort()
    .map((k) => {
      const v = params[k];
      return `${k}=${v === undefined || v === null ? "" : String(v)}`;
    })
    .join("");
  const algorithm = version === 2 ? "md5" : "sha256";
  return crypto.createHash(algorithm).update(base + secret, "utf8").digest("hex");
}

/** 길이가 달라도 예외 없이 false 를 돌려주는 상수 시간 비교. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Paymentwall 이 보내는 pingback 의 서명을 검증한다.
 * 공식 라이브러리는 sig 만 제외하고 나머지 전 파라미터(sign_version 포함)를 해시한다.
 * IP 화이트리스트는 쓰지 않는다 — 서명 검증으로 충분하고, IP 대역은 바뀐다.
 */
export function verifyPingbackSignature(params: Record<string, string>): boolean {
  const config = getPaymentwallConfig();
  if (!config) return false;

  const { sig, ...rest } = params;
  if (!sig) return false;

  const version = Number(params.sign_version) || SIGN_VERSION;
  const expected = calculateSignature(rest, config.secretKey, version);
  return safeEqual(sig, expected);
}

/**
 * 플랜 × 주기 → Paymentwall 상품 id.
 * 구독 상품은 id 가 안정적이어야 하므로 주문번호가 아니라 플랜에서 파생시킨다.
 * pingback 의 goodsid 로 되돌아오며, 이 값으로 어떤 플랜이 결제됐는지 역산한다.
 */
export function productIdFor(plan: Exclude<PlanId, "free">, interval: BillingInterval): string {
  return `${plan}_${interval}`;
}

/** goodsid → 플랜·주기 역방향 조회. 알 수 없는 값이면 undefined. */
export function planForProductId(
  goodsId: string,
): { plan: Exclude<PlanId, "free">; interval: BillingInterval } | undefined {
  for (const plan of ["pro", "professional"] as const) {
    for (const interval of ["month", "year"] as const) {
      if (productIdFor(plan, interval) === goodsId) return { plan, interval };
    }
  }
  return undefined;
}

/**
 * 결제 위젯 URL 생성.
 * amount 는 통화의 주 단위로 보낸다 — 우리 plans.ts 는 최소 단위(센트)로 저장하므로 100으로 나눈다.
 */
export function buildWidgetUrl(opts: {
  userId: string;
  plan: Exclude<PlanId, "free">;
  interval: BillingInterval;
  email?: string;
  successUrl: string;
  failureUrl: string;
}): string | null {
  const config = getPaymentwallConfig();
  if (!config) return null;

  const def = PLANS[opts.plan];
  const minorUnits = opts.interval === "year" ? def.annualAmount : def.amount;
  if (minorUnits == null) return null;

  const params: SignParams = {
    key: config.projectKey,
    uid: opts.userId,
    widget: config.widgetCode,
    amount: (minorUnits / 100).toFixed(2),
    currencyCode: def.currency.toUpperCase(),
    ag_name: `ZEFF AI ${def.name}`,
    ag_external_id: productIdFor(opts.plan, opts.interval),
    ag_type: "subscription",
    ag_period_length: 1,
    ag_period_type: opts.interval,
    ag_recurring: 1,
    success_url: opts.successUrl,
    failure_url: opts.failureUrl,
    sign_version: SIGN_VERSION,
    ...(opts.email ? { email: opts.email } : {}),
  };

  params.sign = calculateSignature(params, config.secretKey, SIGN_VERSION);

  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v ?? ""))}`)
    .join("&");

  return `${WIDGET_URL}?${query}`;
}

/**
 * pingback type 값. 공식 문서 기준.
 * 0 결제 완료 / 2 차지백·환불·사기 / 12 구독 해지 / 13 구독 만료 / 14 갱신 결제 실패
 */
export const PINGBACK_TYPE = {
  PAYMENT: "0",
  CHARGEBACK: "2",
  SUBSCRIPTION_CANCELED: "12",
  SUBSCRIPTION_EXPIRED: "13",
  RENEWAL_FAILED: "14",
} as const;
