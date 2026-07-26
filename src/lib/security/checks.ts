import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { scanSourceForSecrets } from "./secretScan";

export type CheckResult = "pass" | "fail" | "warn";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type SecurityDomain =
  | "auth"
  | "http"
  | "secrets"
  | "access-control"
  | "rate-limit"
  | "jwt"
  | "deps"
  | "env";

export type SecurityCheckOutcome = {
  checkId: string;
  skillIds: string[];
  severity: Severity;
  title: string;
  detail: string;
  remediation: string;
  result: CheckResult;
  /** 대시보드 그룹핑용 — runSecurityChecks가 checkId 접두어로 채운다 */
  domain?: SecurityDomain;
};

/** checkId 접두어 → 도메인. 신규 접두어가 생기면 여기에 매핑만 추가. */
export function domainForCheck(checkId: string): SecurityDomain {
  const prefix = checkId.split(".")[0];
  switch (prefix) {
    case "http":
    case "cookie":
      return "http";
    case "secrets":
    case "data":
      return "secrets";
    case "bac":
    case "upload":
      return "access-control";
    case "ratelimit":
      return "rate-limit";
    case "jwt":
      return "jwt";
    case "deps":
      return "deps";
    case "env":
    case "cron":
      return "env";
    case "auth":
    default:
      return "auth";
  }
}

const ROOT = process.cwd();

async function readSrc(rel: string): Promise<string> {
  return readFile(join(ROOT, rel), "utf8");
}

async function checkSessionRevokeOnReset(): Promise<SecurityCheckOutcome> {
  const checkId = "auth.session_revoke_on_reset";
  const skillIds = ["testing-api-authentication-weaknesses"];
  try {
    const src = await readSrc("src/app/api/auth/reset-password/route.ts");
    const ok =
      src.includes("sessionVersion") &&
      (src.includes("increment: 1") || src.includes("sessionVersion: { increment"));
    return {
      checkId,
      skillIds,
      severity: "high",
      title: "비밀번호 재설정 시 세션 무효화",
      detail: ok
        ? "reset-password 경로에서 sessionVersion을 증가시킵니다."
        : "reset-password가 sessionVersion을 올리지 않아 옛 JWT가 남을 수 있습니다.",
      remediation:
        "POST /api/auth/reset-password 성공 시 passwordHash와 함께 sessionVersion을 +1 하세요.",
      result: ok ? "pass" : "fail",
    };
  } catch (e) {
    return {
      checkId,
      skillIds,
      severity: "high",
      title: "비밀번호 재설정 시 세션 무효화",
      detail: `소스 검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "reset-password 라우트 파일을 확인하세요.",
      result: "warn",
    };
  }
}

async function checkOtpCsprng(): Promise<SecurityCheckOutcome> {
  const checkId = "auth.otp_uses_csprng";
  const skillIds = ["testing-api-authentication-weaknesses"];
  try {
    const src = await readSrc("src/lib/otp.ts");
    const ok =
      src.includes("randomInt") &&
      src.includes("node:crypto") &&
      !/Math\.random\s*\(/.test(src);
    return {
      checkId,
      skillIds,
      severity: "high",
      title: "OTP 암호학적 난수",
      detail: ok
        ? "otp.ts가 crypto.randomInt를 사용하고 Math.random을 쓰지 않습니다."
        : "OTP가 Math.random 등 비암호 PRNG를 쓰거나 randomInt가 없습니다.",
      remediation: "generateCode()에서 crypto.randomInt(100000, 1000000)을 사용하세요.",
      result: ok ? "pass" : "fail",
    };
  } catch (e) {
    return {
      checkId,
      skillIds,
      severity: "high",
      title: "OTP 암호학적 난수",
      detail: `소스 검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "src/lib/otp.ts를 확인하세요.",
      result: "warn",
    };
  }
}

function checkAdminEmails(): SecurityCheckOutcome {
  const checkId = "auth.admin_emails_configured";
  const skillIds = ["testing-for-broken-access-control"];
  const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isProd = process.env.NODE_ENV === "production";
  if (list.length > 0) {
    return {
      checkId,
      skillIds,
      severity: "critical",
      title: "ADMIN_EMAILS 설정",
      detail: `관리자 allowlist에 ${list.length}개 이메일이 설정되어 있습니다.`,
      remediation: "운영 중에도 ADMIN_EMAILS를 최신으로 유지하세요.",
      result: "pass",
    };
  }
  return {
    checkId,
    skillIds,
    severity: "critical",
    title: "ADMIN_EMAILS 설정",
    detail: isProd
      ? "프로덕션에서 ADMIN_EMAILS가 비어 있습니다. 관리자 권한이 없습니다."
      : "ADMIN_EMAILS가 비어 있습니다. 로컬에서는 경고, 프로덕션에서는 치명적입니다.",
    remediation: "호스트에 ADMIN_EMAILS=admin@example.com 형태로 설정하세요.",
    result: isProd ? "fail" : "warn",
  };
}

async function checkCspPresent(): Promise<SecurityCheckOutcome> {
  const checkId = "http.csp_present";
  const skillIds = ["testing-for-xss-vulnerabilities"];
  const src = await readMiddlewareSrc();
  if (!src) {
    return {
      checkId,
      skillIds,
      severity: "medium",
      title: "CSP (nonce) 적용",
      detail: "proxy/middleware 소스를 찾을 수 없습니다.",
      remediation: "src/proxy.ts에서 CSP 헤더와 x-nonce를 설정하세요.",
      result: "fail",
    };
  }
  const ok =
    src.includes("Content-Security-Policy") &&
    (src.includes("nonce-") || src.includes("x-nonce"));
  return {
    checkId,
    skillIds,
    severity: "medium",
    title: "CSP (nonce) 적용",
    detail: ok
      ? "proxy에서 Content-Security-Policy와 nonce를 설정합니다."
      : "proxy에 CSP/nonce 설정이 보이지 않습니다.",
    remediation: "src/proxy.ts에서 CSP 헤더와 x-nonce를 설정하세요.",
    result: ok ? "pass" : "fail",
  };
}

async function checkHstsPresent(): Promise<SecurityCheckOutcome> {
  const checkId = "http.hsts_present";
  const skillIds = ["testing-for-xss-vulnerabilities"];
  const isProd = process.env.NODE_ENV === "production";
  const src = await readMiddlewareSrc();
  if (!src) {
    return {
      checkId,
      skillIds,
      severity: "medium",
      title: "HSTS 헤더",
      detail: "proxy/middleware 검사 실패(소스 없음).",
      remediation: "src/proxy.ts를 확인하세요.",
      result: "warn",
    };
  }
  const ok = src.includes("Strict-Transport-Security");
  if (ok) {
    return {
      checkId,
      skillIds,
      severity: "medium",
      title: "HSTS 헤더",
      detail: "proxy에 Strict-Transport-Security가 정의되어 있습니다.",
      remediation: "프로덕션에서 HSTS가 실제로 응답에 붙는지 확인하세요.",
      result: "pass",
    };
  }
  return {
    checkId,
    skillIds,
    severity: "medium",
    title: "HSTS 헤더",
    detail: "HSTS 정의가 없습니다.",
    remediation: "프로덕션 응답에 Strict-Transport-Security를 추가하세요.",
    result: isProd ? "fail" : "warn",
  };
}

async function checkInquiryLogin(): Promise<SecurityCheckOutcome> {
  const checkId = "upload.inquiry_requires_login";
  const skillIds = [
    "testing-for-sensitive-data-exposure",
    "testing-api-security-with-owasp-top-10",
  ];
  try {
    const src = await readSrc("src/app/api/support/inquiry/route.ts");
    const postGuarded =
      src.includes("export async function POST") &&
      src.includes("session") &&
      (src.includes("needLogin") || src.includes("로그인이 필요"));
    return {
      checkId,
      skillIds,
      severity: "high",
      title: "문의 API 로그인 필수",
      detail: postGuarded
        ? "문의 POST가 로그인 세션을 요구합니다."
        : "문의 POST에 로그인 검사가 없거나 약합니다.",
      remediation: "POST /api/support/inquiry에서 auth() 후 미로그인 시 401을 반환하세요.",
      result: postGuarded ? "pass" : "fail",
    };
  } catch (e) {
    return {
      checkId,
      skillIds,
      severity: "high",
      title: "문의 API 로그인 필수",
      detail: `소스 검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "inquiry route를 확인하세요.",
      result: "warn",
    };
  }
}

async function checkCronQuerySecret(): Promise<SecurityCheckOutcome> {
  const checkId = "cron.query_secret_disabled_in_prod";
  const skillIds = ["testing-for-sensitive-data-exposure"];
  try {
    const src = await readSrc("src/lib/cronAuth.ts");
    const queryOnlyInNonProd =
      src.includes('searchParams.get("secret")') &&
      src.includes('NODE_ENV !== "production"');
    const noQueryAtAll = !src.includes('searchParams.get("secret")');
    const ok = noQueryAtAll || queryOnlyInNonProd;
    return {
      checkId,
      skillIds,
      severity: "medium",
      title: "Cron 시크릿 쿼리 차단",
      detail: ok
        ? "프로덕션에서는 쿼리 ?secret= 을 허용하지 않거나 쿼리 경로가 없습니다."
        : "프로덕션에서도 쿼리 시크릿을 받을 수 있습니다.",
      remediation: "verifyCronSecret에서 production일 때 query secret을 거부하세요.",
      result: ok ? "pass" : "fail",
    };
  } catch {
    return {
      checkId,
      skillIds,
      severity: "medium",
      title: "Cron 시크릿 쿼리 차단",
      detail: "cronAuth.ts 검사 실패.",
      remediation: "src/lib/cronAuth.ts를 확인하세요.",
      result: "warn",
    };
  }
}

async function checkNextAuthVersion(): Promise<SecurityCheckOutcome> {
  const checkId = "deps.next_auth_min_version";
  const skillIds = [
    "testing-api-authentication-weaknesses",
    "testing-api-security-with-owasp-top-10",
  ];
  try {
    const raw = await readSrc("package.json");
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> };
    const ver = pkg.dependencies?.["next-auth"] ?? "";
    // 5.0.0-beta.32+ 권장 (Auth.js 0.41.3)
    const m = ver.match(/5\.0\.0-beta\.(\d+)/);
    const beta = m ? Number(m[1]) : NaN;
    const ok = Number.isFinite(beta) && beta >= 32;
    return {
      checkId,
      skillIds,
      severity: "critical",
      title: "next-auth 최소 버전",
      detail: ok
        ? `next-auth=${ver} (beta.32+).`
        : `next-auth=${ver || "(없음)"} — Auth.js Critical 패치(beta.32+/0.41.3) 미만일 수 있습니다.`,
      remediation: "next-auth@5.0.0-beta.32 이상으로 업그레이드하세요.",
      result: ok ? "pass" : "fail",
    };
  } catch (e) {
    return {
      checkId,
      skillIds,
      severity: "critical",
      title: "next-auth 최소 버전",
      detail: `package.json 검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "package.json의 next-auth 버전을 확인하세요.",
      result: "warn",
    };
  }
}

function checkAuthSecret(): SecurityCheckOutcome {
  const checkId = "env.auth_secret_present";
  const skillIds = ["testing-api-authentication-weaknesses"];
  const has = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
  );
  const isProd = process.env.NODE_ENV === "production";
  return {
    checkId,
    skillIds,
    severity: "critical",
    title: "AUTH_SECRET / NEXTAUTH_SECRET",
    detail: has
      ? "세션 서명 시크릿이 설정되어 있습니다."
      : "AUTH_SECRET(또는 NEXTAUTH_SECRET)이 비어 있습니다.",
    remediation: "호스트에 AUTH_SECRET을 충분히 긴 랜덤 값으로 설정하세요.",
    result: has ? "pass" : isProd ? "fail" : "warn",
  };
}

/**
 * 결제는 세 값이 모두 있어야 동작한다. 하나만 비어도 결제창이 503 으로 죽는데,
 * 그 상태는 사용자가 결제를 시도하기 전까지 드러나지 않으므로 여기서 잡는다.
 * 시크릿 키는 pingback 위조 방어의 유일한 수단이라 없으면 치명적이다.
 */
function checkPaymentwallEnv(): SecurityCheckOutcome {
  const checkId = "env.paymentwall_keys_present";
  const skillIds = ["testing-for-sensitive-data-exposure"];
  const title = "Paymentwall 키";
  const required = [
    "PAYMENTWALL_PROJECT_KEY",
    "PAYMENTWALL_SECRET_KEY",
    "PAYMENTWALL_WIDGET_CODE",
  ];
  const missing = required.filter((k) => !process.env[k]?.trim());

  // 하나도 없으면 아직 연동 전 — 결제 CTA 도 꺼져 있으므로 정상 상태다.
  if (missing.length === required.length) {
    return {
      checkId,
      skillIds,
      severity: "low",
      title,
      detail: "Paymentwall 키가 없어 결제 미연동으로 간주합니다.",
      remediation: "결제를 개시할 때 세 환경변수를 모두 설정하세요.",
      result: "pass",
    };
  }

  return {
    checkId,
    skillIds,
    severity: "high",
    title,
    detail:
      missing.length === 0
        ? "PROJECT_KEY · SECRET_KEY · WIDGET_CODE 가 모두 설정되어 있습니다."
        : `일부만 설정돼 결제가 실패합니다. 누락: ${missing.join(", ")}`,
    remediation:
      "Paymentwall 대시보드의 공개키·개인키·위젯 코드를 해당 환경변수에 모두 넣으세요.",
    result: missing.length === 0 ? "pass" : "fail",
  };
}

function checkCronSecretPresent(): SecurityCheckOutcome {
  const checkId = "env.cron_secret_present";
  const skillIds = ["testing-for-sensitive-data-exposure"];
  const has = Boolean(process.env.CRON_SECRET?.trim());
  const isProd = process.env.NODE_ENV === "production";
  return {
    checkId,
    skillIds,
    severity: "medium",
    title: "CRON_SECRET",
    detail: has
      ? "CRON_SECRET이 설정되어 있습니다."
      : "CRON_SECRET이 비어 있습니다. 프로덕션 cron/RAG 엔드포인트가 열릴 수 있습니다.",
    remediation: "Vercel Cron과 동일한 CRON_SECRET을 설정하세요.",
    result: has ? "pass" : isProd ? "fail" : "warn",
  };
}

type NpmAuditCache = { at: number; outcome: SecurityCheckOutcome };
let npmAuditCache: NpmAuditCache | null = null;
const NPM_AUDIT_TTL_MS = 60 * 60 * 1000;

async function checkNpmAuditCriticalHigh(): Promise<SecurityCheckOutcome> {
  const checkId = "deps.npm_audit_critical_high";
  const skillIds = ["testing-api-security-with-owasp-top-10"];

  if (npmAuditCache && Date.now() - npmAuditCache.at < NPM_AUDIT_TTL_MS) {
    return { ...npmAuditCache.outcome, detail: `${npmAuditCache.outcome.detail} (캐시)` };
  }

  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  try {
    const { stdout } = await execFileAsync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["audit", "--json", "--omit=dev"],
      {
        cwd: ROOT,
        timeout: 45_000,
        maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, npm_config_audit: "true" },
      },
    );
    const report = JSON.parse(stdout || "{}") as {
      metadata?: { vulnerabilities?: Record<string, number> };
      vulnerabilities?: Record<
        string,
        { severity?: string; via?: unknown; effects?: string[] }
      >;
    };
    const meta = report.metadata?.vulnerabilities ?? {};
    const critical = Number(meta.critical ?? 0);
    const high = Number(meta.high ?? 0);
    const names = Object.entries(report.vulnerabilities ?? {})
      .filter(([, v]) => v.severity === "critical" || v.severity === "high")
      .map(([name, v]) => `${name}(${v.severity})`)
      .slice(0, 12);

    const outcome: SecurityCheckOutcome = {
      checkId,
      skillIds,
      severity: critical > 0 ? "critical" : high > 0 ? "high" : "low",
      title: "npm audit Critical/High",
      detail:
        critical + high === 0
          ? "프로덕션 의존성 npm audit에서 Critical/High가 없습니다."
          : `Critical ${critical}, High ${high}. 예: ${names.join(", ") || "(목록 생략)"}`,
      remediation:
        "npm audit 결과를 검토하고 가능하면 npm audit fix 또는 패키지 업그레이드로 해결하세요.",
      result: critical + high === 0 ? "pass" : "fail",
    };
    npmAuditCache = { at: Date.now(), outcome };
    return outcome;
  } catch (err) {
    // npm audit는 취약점이 있으면 exit code != 0 이면서 stdout에 JSON을 남긴다.
    const e = err as { stdout?: string; message?: string };
    if (e.stdout) {
      try {
        const report = JSON.parse(e.stdout) as {
          metadata?: { vulnerabilities?: Record<string, number> };
          vulnerabilities?: Record<string, { severity?: string }>;
        };
        const meta = report.metadata?.vulnerabilities ?? {};
        const critical = Number(meta.critical ?? 0);
        const high = Number(meta.high ?? 0);
        const names = Object.entries(report.vulnerabilities ?? {})
          .filter(([, v]) => v.severity === "critical" || v.severity === "high")
          .map(([name, v]) => `${name}(${v.severity})`)
          .slice(0, 12);
        const outcome: SecurityCheckOutcome = {
          checkId,
          skillIds,
          severity: critical > 0 ? "critical" : high > 0 ? "high" : "low",
          title: "npm audit Critical/High",
          detail:
            critical + high === 0
              ? "프로덕션 의존성 npm audit에서 Critical/High가 없습니다."
              : `Critical ${critical}, High ${high}. 예: ${names.join(", ") || "(목록 생략)"}`,
          remediation:
            "npm audit 결과를 검토하고 가능하면 의존성을 업그레이드하세요.",
          result: critical + high === 0 ? "pass" : "fail",
        };
        npmAuditCache = { at: Date.now(), outcome };
        return outcome;
      } catch {
        /* fall through */
      }
    }
    const outcome: SecurityCheckOutcome = {
      checkId,
      skillIds,
      severity: "medium",
      title: "npm audit Critical/High",
      detail: `npm audit 실행 실패(서버리스/타임아웃 가능): ${e.message ?? String(err)}`,
      remediation:
        "CI에서 npm audit를 실행하거나 로컬에서 점검한 뒤 결과를 기록하세요.",
      result: "warn",
    };
    npmAuditCache = { at: Date.now(), outcome };
    return outcome;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// v2 스킬 기반 신규 점검팩
// 헤더 소스는 미들웨어에 있다(WIP에서 CSP/보안헤더가 middleware.ts로 이동).
// ─────────────────────────────────────────────────────────────────────────

/** 미들웨어 소스를 한 번 읽어 캐시(여러 헤더 체크가 공유). null = 파일 없음. */
let middlewareSrcCache: { at: number; src: string | null } | null = null;
async function readMiddlewareSrc(): Promise<string | null> {
  if (middlewareSrcCache && Date.now() - middlewareSrcCache.at < 5000) {
    return middlewareSrcCache.src;
  }
  let src: string | null = null;
  for (const rel of ["src/middleware.ts", "src/proxy.ts", "middleware.ts"]) {
    try {
      src = await readSrc(rel);
      break;
    } catch {
      /* 다음 후보 */
    }
  }
  middlewareSrcCache = { at: Date.now(), src };
  return src;
}

// skill: performing-security-headers-audit
async function checkCspNoUnsafeInline(): Promise<SecurityCheckOutcome> {
  const checkId = "http.csp_no_unsafe_inline";
  const skillIds = ["performing-security-headers-audit", "testing-for-xss-vulnerabilities"];
  const src = await readMiddlewareSrc();
  if (!src) {
    return {
      checkId, skillIds, severity: "high", title: "CSP script-src 강화",
      detail: "proxy/middleware 소스를 찾을 수 없어 CSP를 확인하지 못했습니다.",
      remediation: "src/proxy.ts에서 script-src를 확인하세요.",
      result: "warn",
    };
  }
  // 개발 전용 분기(`? "script-src ... 'unsafe-eval'"`)는 프로덕션 판정에서 제외한다.
  const scriptSrcLines = src.split(/\r?\n/).filter((l) => l.includes("script-src"));
  const prodScriptSrc = scriptSrcLines.filter((l) => !l.trim().startsWith("?"));
  const hasUnsafeInline = prodScriptSrc.some((l) => l.includes("'unsafe-inline'"));
  const hasUnsafeEval = prodScriptSrc.some((l) => l.includes("'unsafe-eval'"));
  const usesNonce = src.includes("nonce-");

  // unsafe-eval은 프로덕션에서 정당한 사유가 없다 — 진짜 결함.
  if (hasUnsafeEval) {
    return {
      checkId, skillIds, severity: "high", title: "CSP script-src 강화",
      detail: "프로덕션 script-src에 'unsafe-eval'이 있습니다. 임의 코드 실행 위험이 큽니다.",
      remediation: "프로덕션 분기에서 'unsafe-eval'을 제거하세요(개발 HMR 분기에만 허용).",
      result: "fail",
    };
  }
  // 이상적 상태: nonce 기반으로 잠김
  if (!hasUnsafeInline && usesNonce) {
    return {
      checkId, skillIds, severity: "high", title: "CSP script-src 강화",
      detail: "script-src에 unsafe-inline이 없고 nonce 기반으로 잠겨 있습니다.",
      remediation: "현 상태를 유지하세요.",
      result: "pass",
    };
  }
  // 알려진 트레이드오프: 정적 프리렌더 페이지에서는 요청별 nonce 주입이 불가능하다.
  // 이전에 nonce+strict-dynamic을 강제했다가 전체 JS가 차단되는 프로덕션 장애가 났다.
  // 숨기지 않고 warn으로 계속 노출하되, 실제 해결 경로(동적 렌더링 전환)를 남긴다.
  return {
    checkId, skillIds, severity: "medium", title: "CSP script-src 강화",
    detail:
      "script-src에 'unsafe-inline'이 있어 XSS 방어가 약화됩니다. " +
      "다만 랜딩이 정적 프리렌더라 요청별 nonce 주입이 불가능해 현재는 의도된 트레이드오프입니다.",
    remediation:
      "nonce+strict-dynamic으로 올리려면 먼저 해당 라우트를 동적 렌더링으로 전환하고, " +
      "CSP를 요청 헤더에도 설정해 Next.js가 nonce를 script 태그에 주입하게 해야 합니다.",
    result: "warn",
  };
}

// skill: performing-security-headers-audit — 단순 헤더 존재 체크 공통 팩토리
function headerPresenceCheck(
  checkId: string,
  title: string,
  needle: string,
  remediation: string,
  severity: Severity = "medium",
): () => Promise<SecurityCheckOutcome> {
  const skillIds = ["performing-security-headers-audit"];
  return async () => {
    const src = await readMiddlewareSrc();
    if (!src) {
      return { checkId, skillIds, severity, title, detail: "미들웨어 소스를 찾을 수 없습니다.", remediation, result: "warn" };
    }
    const ok = src.includes(needle);
    return {
      checkId, skillIds, severity, title,
      detail: ok ? `${needle} 헤더가 설정되어 있습니다.` : `${needle} 헤더가 보이지 않습니다.`,
      remediation, result: ok ? "pass" : "fail",
    };
  };
}

// skill: performing-security-headers-audit (쿠키 속성)
function checkSessionCookieFlags(): SecurityCheckOutcome {
  const checkId = "cookie.session_secure_flags";
  const skillIds = ["performing-security-headers-audit", "testing-jwt-token-security"];
  // NextAuth v5는 기본적으로 httpOnly + sameSite=lax + (https)secure 쿠키를 쓴다.
  // 위험은 이 기본값을 secure:false / httpOnly:false 로 "낮춰" 덮어썼을 때다.
  return {
    checkId, skillIds, severity: "medium", title: "세션 쿠키 보안 플래그",
    // auth.ts 정적 확인은 아래 러너에서 소스 기반으로 대체하지만, 동기 기본형을 둔다.
    detail: "NextAuth 기본 세션 쿠키(HttpOnly/SameSite/prod Secure)를 낮추는 오버라이드가 없어야 합니다.",
    remediation: "auth.ts의 cookies 설정에서 secure:false / httpOnly:false 로 낮추지 마세요.",
    result: "pass",
  };
}

async function checkSessionCookieFlagsSrc(): Promise<SecurityCheckOutcome> {
  const base = checkSessionCookieFlags();
  try {
    const src = await readSrc("src/auth.ts");
    const lowered = /secure:\s*false/.test(src) || /httpOnly:\s*false/.test(src);
    if (lowered) {
      return {
        ...base,
        detail: "auth.ts가 세션 쿠키의 secure/httpOnly를 false로 낮췄습니다.",
        result: "fail",
      };
    }
    return base;
  } catch {
    return { ...base, detail: "auth.ts를 확인하지 못했습니다.", result: "warn" };
  }
}

// skill: implementing-secret-scanning-with-gitleaks, testing-for-sensitive-data-exposure
async function checkNoHardcodedSecrets(): Promise<SecurityCheckOutcome> {
  const checkId = "secrets.no_hardcoded_in_src";
  const skillIds = ["implementing-secret-scanning-with-gitleaks", "testing-for-sensitive-data-exposure"];
  try {
    const hits = await scanSourceForSecrets();
    if (hits.length === 0) {
      return {
        checkId, skillIds, severity: "critical", title: "소스 하드코딩 시크릿",
        detail: "src/ 정적 스캔에서 하드코딩 시크릿을 찾지 못했습니다.",
        remediation: "시크릿은 계속 환경변수(process.env)로만 관리하세요.",
        result: "pass",
      };
    }
    const sample = hits.slice(0, 5).map((h) => `${h.file}:${h.line} ${h.kind}=${h.masked}`);
    return {
      checkId, skillIds, severity: "critical", title: "소스 하드코딩 시크릿",
      detail: `잠재 시크릿 ${hits.length}건. 예: ${sample.join(" | ")}`,
      remediation: "해당 값을 즉시 회수/로테이션하고 환경변수로 옮기세요. git history에 남았다면 별도 정리 필요.",
      result: "fail",
    };
  } catch (e) {
    return {
      checkId, skillIds, severity: "critical", title: "소스 하드코딩 시크릿",
      detail: `시크릿 스캔 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "src 디렉터리 접근을 확인하세요.",
      result: "warn",
    };
  }
}

// skill: implementing-secret-scanning-with-gitleaks
async function checkEnvGitignored(): Promise<SecurityCheckOutcome> {
  const checkId = "secrets.env_gitignored";
  const skillIds = ["implementing-secret-scanning-with-gitleaks"];
  try {
    const gi = await readSrc(".gitignore");
    const ok = /^\s*\.env\*?\s*$/m.test(gi) || /^\s*\/?\.env/m.test(gi);
    return {
      checkId, skillIds, severity: "high", title: ".env gitignore",
      detail: ok ? ".gitignore가 .env* 를 제외합니다." : ".gitignore에 .env 제외가 보이지 않습니다.",
      remediation: ".gitignore에 `.env*` 를 추가해 시크릿 파일이 커밋되지 않게 하세요.",
      result: ok ? "pass" : "fail",
    };
  } catch {
    return {
      checkId, skillIds, severity: "high", title: ".env gitignore",
      detail: ".gitignore를 찾을 수 없습니다.",
      remediation: ".gitignore를 만들고 `.env*` 를 추가하세요.",
      result: "warn",
    };
  }
}

// skill: testing-for-sensitive-data-exposure — passwordHash 응답 과다노출 방지
// 오탐 방지: `bcrypt.compare(..., user.passwordHash)`·`!!user?.passwordHash`(불리언 파생)·
// `select: { passwordHash: true }`(뽑아서 비교) 는 정상. 실제 유출은 "해시를 응답 객체에 그대로 싣는" 경우다.
async function checkNoPasswordHashLeak(): Promise<SecurityCheckOutcome> {
  const checkId = "data.no_passwordhash_leak";
  const skillIds = ["testing-for-sensitive-data-exposure"];
  // 실제 유출 형태만: 해시 "값"을 passwordHash 키로 되돌려주거나, 원본 user 레코드를 그대로 응답.
  // (안전 케이스는 제외: `hasPassword: !!user?.passwordHash` 불리언 파생, `select: { passwordHash: true }`,
  //  `bcrypt.compare(..., user.passwordHash)`)
  const LEAK_PATTERNS = [
    /passwordHash:\s*[\w$]+[\w.?$[\]'"]*\.passwordHash/, // { passwordHash: user.passwordHash }
    /NextResponse\.json\(\s*user[\s,)]/, // json(user)
    /NextResponse\.json\(\s*\{\s*\.\.\.\s*user\b/, // json({ ...user })
  ];
  try {
    const files = await listRouteFiles();
    const offenders: string[] = [];
    for (const rel of files) {
      const src = await readSrc(rel);
      if (!src.includes("passwordHash")) continue;
      if (LEAK_PATTERNS.some((re) => re.test(src))) offenders.push(rel);
    }
    if (offenders.length === 0) {
      return {
        checkId, skillIds, severity: "high", title: "passwordHash 응답 노출",
        detail: "어떤 API 라우트도 passwordHash를 응답에 싣지 않습니다(compare/불리언 파생만 사용).",
        remediation: "앞으로도 응답 객체에 passwordHash를 넣지 마세요.",
        result: "pass",
      };
    }
    return {
      checkId, skillIds, severity: "critical", title: "passwordHash 응답 노출",
      detail: `passwordHash를 응답에 실을 수 있는 라우트: ${offenders.slice(0, 8).join(", ")}`,
      remediation: "응답에서 passwordHash를 제거하세요. 필요하면 hasPassword 같은 불리언만 반환하세요.",
      result: "fail",
    };
  } catch (e) {
    return {
      checkId, skillIds, severity: "high", title: "passwordHash 응답 노출",
      detail: `검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "API 라우트를 확인하세요.",
      result: "warn",
    };
  }
}

/** src/app/api 아래 모든 route.ts 를 repo-relative 경로로 나열 */
async function listRouteFiles(): Promise<string[]> {
  const apiDir = join(ROOT, "src", "app", "api");
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && e.name === "route.ts") {
        out.push(relative(ROOT, full).split(sep).join("/"));
      }
    }
  }
  await walk(apiDir);
  return out;
}

// skill: testing-for-broken-access-control — 모든 API 라우트가 인증을 호출하는지
async function checkApiRoutesAuthed(): Promise<SecurityCheckOutcome> {
  const checkId = "bac.api_routes_authed";
  const skillIds = ["testing-for-broken-access-control", "testing-api-security-with-owasp-top-10"];
  // 의도적으로 공개인 경로(로그인 전 흐름·크론·결제 콜백). 이들은 별도로 레이트리밋이나
  // 시크릿·서명 검증을 받는다.
  const publicPrefixes = [
    "src/app/api/auth/", // NextAuth 핸들러 + signup/otp/reset (rate-limit로 보호)
    "src/app/api/cron/", // CRON_SECRET 검증
    "src/app/api/account/2fa/login-challenge/", // 로그인 1단계(세션 전) — login rate-limit 공유
    "src/app/api/paymentwall/pingback/", // 결제대행사 콜백 — HMAC 서명 검증
  ];
  const authMarkers = [
    "auth()", "requireUserId", "requireSession", "requireSecurityAdmin",
    "requireAdmin", "getServerSession", "verifyCronSecret",
    "verifyPingbackSignature",
  ];
  try {
    const files = await listRouteFiles();
    const offenders: string[] = [];
    for (const rel of files) {
      if (publicPrefixes.some((p) => rel.startsWith(p))) continue;
      const src = await readSrc(rel);
      if (!authMarkers.some((m) => src.includes(m))) offenders.push(rel);
    }
    if (offenders.length === 0) {
      return {
        checkId, skillIds, severity: "critical", title: "API 라우트 인증 커버리지",
        detail: "공개 allowlist 외 모든 API 라우트가 인증/권한 호출을 참조합니다.",
        remediation: "새 라우트 추가 시에도 auth()/requireUserId 등을 반드시 호출하세요.",
        result: "pass",
      };
    }
    return {
      checkId, skillIds, severity: "critical", title: "API 라우트 인증 커버리지",
      detail: `인증 참조가 없는 라우트 ${offenders.length}건: ${offenders.slice(0, 10).join(", ")}`,
      remediation: "각 라우트 핸들러에서 세션/권한을 확인하고 미인증 시 401/403을 반환하세요. 의도적 공개면 allowlist에 추가.",
      result: "fail",
    };
  } catch (e) {
    return {
      checkId, skillIds, severity: "critical", title: "API 라우트 인증 커버리지",
      detail: `검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "src/app/api 접근을 확인하세요.",
      result: "warn",
    };
  }
}

// skill: testing-for-broken-access-control — 멀티테넌트 스코핑 인프라 사용 여부
async function checkTenantScoping(): Promise<SecurityCheckOutcome> {
  const checkId = "bac.tenant_scoping";
  const skillIds = ["testing-for-broken-access-control"];
  try {
    const helper = await readSrc("src/lib/workspace.ts");
    const hasHelpers =
      helper.includes("itemAccessWhere") ||
      helper.includes("listWhere") ||
      helper.includes("resolveScope");
    // 대표적인 테넌트 스코프 라우트에서 스코핑 헬퍼를 실제로 쓰는지 표본 확인
    const samples = [
      "src/app/api/chat/sessions/route.ts",
      "src/app/api/library/route.ts",
    ];
    let used = 0;
    for (const rel of samples) {
      try {
        const s = await readSrc(rel);
        if (/itemAccessWhere|listWhere|resolveScope|workspaceId|userId/.test(s)) used++;
      } catch {
        /* 파일 없으면 스킵 */
      }
    }
    const ok = hasHelpers && used > 0;
    return {
      checkId, skillIds, severity: "high", title: "멀티테넌트 스코핑",
      detail: ok
        ? "공용 스코핑 헬퍼가 존재하고 대표 라우트에서 사용됩니다."
        : "테넌트 스코핑 헬퍼 사용을 확인하지 못했습니다(수동 검토 권장).",
      remediation: "워크스페이스 스코프 쿼리는 항상 itemAccessWhere/listWhere로 userId·workspaceId를 강제하세요.",
      result: ok ? "pass" : "warn",
    };
  } catch (e) {
    return {
      checkId, skillIds, severity: "high", title: "멀티테넌트 스코핑",
      detail: `검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "src/lib/workspace.ts를 확인하세요.",
      result: "warn",
    };
  }
}

// skill: implementing-api-rate-limiting-and-throttling
async function checkAuthRateLimited(): Promise<SecurityCheckOutcome> {
  const checkId = "ratelimit.auth_endpoints";
  const skillIds = ["implementing-api-rate-limiting-and-throttling", "testing-api-authentication-weaknesses"];
  // 결제 경로도 함께 본다 — 카드 테스팅 봇의 표적이라 무차별 대입 방어가 필요한
  // 성격이 인증 경로와 같다. 별도 점검을 만들지 않고 대상만 넓혔다.
  const targets = [
    "src/auth.ts",
    "src/app/api/auth/otp/route.ts",
    "src/app/api/auth/signup/route.ts",
    "src/app/api/auth/reset-password/route.ts",
    "src/app/api/account/password/route.ts",
    "src/app/api/checkout/route.ts",
    "src/app/api/checkout/confirm/route.ts",
  ];
  try {
    const missing: string[] = [];
    for (const rel of targets) {
      try {
        const s = await readSrc(rel);
        if (!/checkRateLimit|assertRateLimit/.test(s)) missing.push(rel);
      } catch {
        /* 파일 없으면 대상 아님 */
      }
    }
    if (missing.length === 0) {
      return {
        checkId, skillIds, severity: "high", title: "인증·결제 엔드포인트 레이트리밋",
        detail: "로그인/OTP/가입/비밀번호/결제 경로가 모두 레이트리밋을 호출합니다.",
        remediation: "새 인증·결제 엔드포인트에도 checkRateLimit/assertRateLimit를 적용하세요.",
        result: "pass",
      };
    }
    return {
      checkId, skillIds, severity: "high", title: "인증·결제 엔드포인트 레이트리밋",
      detail: `레이트리밋이 없는 인증·결제 경로: ${missing.join(", ")}`,
      remediation: "해당 경로에 IP·계정 기준 checkRateLimit를 추가해 무차별 대입을 막으세요.",
      result: "fail",
    };
  } catch (e) {
    return {
      checkId, skillIds, severity: "high", title: "인증·결제 엔드포인트 레이트리밋",
      detail: `검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "인증 경로를 확인하세요.",
      result: "warn",
    };
  }
}

// skill: testing-jwt-token-security
async function checkJwtStrategySecret(): Promise<SecurityCheckOutcome> {
  const checkId = "jwt.session_strategy_secret";
  const skillIds = ["testing-jwt-token-security", "testing-api-authentication-weaknesses"];
  const hasSecret = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
  );
  const isProd = process.env.NODE_ENV === "production";
  try {
    const src = await readSrc("src/auth.ts");
    const jwtStrategy = /strategy:\s*["']jwt["']/.test(src);
    const ok = jwtStrategy && hasSecret;
    return {
      checkId, skillIds, severity: "critical", title: "JWT 세션 전략·시크릿",
      detail: ok
        ? "세션 전략이 jwt이고 서명 시크릿이 설정되어 있습니다(NextAuth 기본 HS512, alg none 미허용)."
        : !jwtStrategy
          ? "auth.ts에서 jwt 세션 전략을 확인하지 못했습니다."
          : "서명 시크릿(AUTH_SECRET)이 비어 있습니다.",
      remediation: "session.strategy를 'jwt'로 두고 AUTH_SECRET을 충분히 긴 랜덤 값으로 설정하세요.",
      result: ok ? "pass" : isProd ? "fail" : "warn",
    };
  } catch {
    return {
      checkId, skillIds, severity: "critical", title: "JWT 세션 전략·시크릿",
      detail: "auth.ts를 확인하지 못했습니다.",
      remediation: "src/auth.ts의 session 설정을 확인하세요.",
      result: "warn",
    };
  }
}

// skill: testing-jwt-token-security — 세션 수명 상한
async function checkJwtMaxAgeBounded(): Promise<SecurityCheckOutcome> {
  const checkId = "jwt.session_maxage_bounded";
  const skillIds = ["testing-jwt-token-security"];
  const MAX_ALLOWED = 90 * 24 * 60 * 60; // 90일
  try {
    const src = await readSrc("src/auth.ts");
    // maxAge: 30 * 24 * 60 * 60  형태를 계산해서 상한과 비교
    const m = src.match(/maxAge:\s*([0-9*\s]+)/);
    if (!m) {
      return {
        checkId, skillIds, severity: "medium", title: "세션 수명 상한",
        detail: "session.maxAge가 명시돼 있지 않습니다(기본값 사용).",
        remediation: "session.maxAge를 명시적으로(예: 30일) 설정하세요.",
        result: "warn",
      };
    }
    // 안전 평가: 숫자와 * 만 허용하는 식이므로 Function 없이 직접 곱셈 파싱
    const seconds = m[1]
      .split("*")
      .map((p) => Number(p.trim()))
      .reduce((a, b) => (Number.isFinite(b) ? a * b : a), 1);
    const ok = Number.isFinite(seconds) && seconds > 0 && seconds <= MAX_ALLOWED;
    return {
      checkId, skillIds, severity: "medium", title: "세션 수명 상한",
      detail: ok
        ? `session.maxAge ≈ ${Math.round(seconds / 86400)}일 — 90일 이하로 적절합니다.`
        : `session.maxAge ≈ ${Math.round(seconds / 86400)}일 — 상한(90일)을 넘거나 파싱 불가.`,
      remediation: "장수명 세션은 탈취 위험이 큽니다. maxAge를 90일 이하로 두세요.",
      result: ok ? "pass" : "warn",
    };
  } catch {
    return {
      checkId, skillIds, severity: "medium", title: "세션 수명 상한",
      detail: "auth.ts를 확인하지 못했습니다.",
      remediation: "src/auth.ts의 session.maxAge를 확인하세요.",
      result: "warn",
    };
  }
}

/** src/app 아래 특정 파일명들을 repo-relative로 나열 */
async function listAppFiles(names: Set<string>): Promise<string[]> {
  const appDir = join(ROOT, "src", "app");
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && names.has(e.name)) {
        out.push(relative(ROOT, full).split(sep).join("/"));
      }
    }
  }
  await walk(appDir);
  return out;
}

// skill: testing-cors-misconfiguration — 위험한 CORS(와일드카드+credentials, origin 반사) 방지
async function checkCorsSafe(): Promise<SecurityCheckOutcome> {
  const checkId = "http.cors_safe";
  const skillIds = ["testing-cors-misconfiguration"];
  try {
    const files = [...(await listRouteFiles()), "src/middleware.ts", "next.config.ts"];
    let anyAcao = false;
    let wildcard = false;
    let credentials = false;
    let reflects = false;
    for (const rel of files) {
      let src: string;
      try {
        src = await readSrc(rel);
      } catch {
        continue;
      }
      if (!src.includes("Access-Control-Allow-Origin")) continue;
      anyAcao = true;
      if (/Access-Control-Allow-Origin["'\s:,)]+\s*\*/.test(src)) wildcard = true;
      if (/Access-Control-Allow-Credentials["'\s:,)]+\s*true/i.test(src)) credentials = true;
      if (/headers\.get\(\s*["']origin["']\s*\)/i.test(src)) reflects = true;
    }
    if (!anyAcao) {
      return {
        checkId, skillIds, severity: "medium", title: "CORS 설정 안전성",
        detail: "CORS 응답 헤더를 직접 열지 않습니다(동일 출처 기본값 = 안전).",
        remediation: "필요할 때만 신뢰 도메인 allowlist로 CORS를 여세요. `*` + credentials 조합은 금지.",
        result: "pass",
      };
    }
    if (wildcard && credentials) {
      return {
        checkId, skillIds, severity: "high", title: "CORS 설정 안전성",
        detail: "Access-Control-Allow-Origin: * 와 credentials:true 를 함께 씁니다(쿠키 탈취 위험).",
        remediation: "와일드카드 대신 신뢰 도메인 allowlist를 쓰고, credentials와 * 를 절대 함께 쓰지 마세요.",
        result: "fail",
      };
    }
    if (reflects) {
      return {
        checkId, skillIds, severity: "high", title: "CORS 설정 안전성",
        detail: "요청 Origin 헤더를 읽어 그대로 반사할 가능성이 보입니다(검증 필요).",
        remediation: "Origin을 allowlist로 검증한 경우에만 Access-Control-Allow-Origin에 반영하세요.",
        result: "warn",
      };
    }
    return {
      checkId, skillIds, severity: "medium", title: "CORS 설정 안전성",
      detail: "CORS 헤더를 설정하지만 위험 조합(*+credentials)/무검증 반사는 감지되지 않았습니다.",
      remediation: "CORS allowlist를 주기적으로 점검하세요.",
      result: "pass",
    };
  } catch (e) {
    return {
      checkId, skillIds, severity: "medium", title: "CORS 설정 안전성",
      detail: `검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "CORS 설정을 수동으로 확인하세요.",
      result: "warn",
    };
  }
}

// skill: testing-for-open-redirect-vulnerabilities — 사용자 입력을 무검증 리다이렉트로 쓰지 않는지
async function checkNoOpenRedirect(): Promise<SecurityCheckOutcome> {
  const checkId = "bac.no_open_redirect";
  const skillIds = ["testing-for-open-redirect-vulnerabilities", "testing-for-broken-access-control"];
  // 위험 형태: searchParams/요청값을 검증 없이 redirect 목적지로 사용.
  const DANGER = [
    /redirect\(\s*[^)]{0,80}searchParams\.get\(/,
    /NextResponse\.redirect\(\s*[^)]{0,80}searchParams/,
    /redirect\(\s*(?:req|request)\b[^)]{0,60}\b(?:url|next|redirect|returnTo|target|goto)\b/i,
  ];
  try {
    const files = await listAppFiles(new Set(["page.tsx", "route.ts", "layout.tsx"]));
    const offenders: string[] = [];
    for (const rel of files) {
      let src: string;
      try {
        src = await readSrc(rel);
      } catch {
        continue;
      }
      if (DANGER.some((re) => re.test(src))) offenders.push(rel);
    }
    if (offenders.length === 0) {
      return {
        checkId, skillIds, severity: "high", title: "오픈 리다이렉트 방지",
        detail: "사용자 입력을 검증 없이 리다이렉트 목적지로 쓰는 패턴이 없습니다(모든 리다이렉트가 내부 경로).",
        remediation: "리다이렉트 목적지는 항상 내부 경로 allowlist 또는 동일 출처로 제한하세요.",
        result: "pass",
      };
    }
    return {
      checkId, skillIds, severity: "high", title: "오픈 리다이렉트 방지",
      detail: `검증 없는 리다이렉트 의심: ${offenders.slice(0, 8).join(", ")}`,
      remediation: "next/url 같은 파라미터는 내부 경로 allowlist로 검증한 뒤에만 리다이렉트하세요.",
      result: "warn",
    };
  } catch (e) {
    return {
      checkId, skillIds, severity: "high", title: "오픈 리다이렉트 방지",
      detail: `검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "리다이렉트 사용처를 수동 확인하세요.",
      result: "warn",
    };
  }
}

// skill: testing-api-security-with-owasp-top-10 — 업로드 라우트가 파일 크기 제한을 강제하는지
async function checkUploadSizeLimit(): Promise<SecurityCheckOutcome> {
  const checkId = "upload.size_limit_enforced";
  const skillIds = ["testing-api-security-with-owasp-top-10", "testing-for-sensitive-data-exposure"];
  const SIZE_GUARDS = ["MAX_UPLOAD_BYTES", "maximumSizeInBytes", ".size >", "maxContentLength"];
  try {
    const files = await listRouteFiles();
    const uploaders: string[] = [];
    const missing: string[] = [];
    for (const rel of files) {
      const src = await readSrc(rel);
      const handlesUpload =
        (/formData\(\)/.test(src) && /instanceof File|getAll\(|\bFile\b/.test(src)) ||
        /handleUpload|maximumSizeInBytes/.test(src);
      if (!handlesUpload) continue;
      uploaders.push(rel);
      if (!SIZE_GUARDS.some((g) => src.includes(g))) missing.push(rel);
    }
    if (uploaders.length === 0) {
      return {
        checkId, skillIds, severity: "medium", title: "업로드 크기 제한",
        detail: "업로드를 처리하는 API 라우트가 감지되지 않았습니다.",
        remediation: "업로드 라우트를 추가하면 반드시 크기 제한을 강제하세요.",
        result: "pass",
      };
    }
    if (missing.length === 0) {
      return {
        checkId, skillIds, severity: "high", title: "업로드 크기 제한",
        detail: `업로드 라우트 ${uploaders.length}곳 모두 파일 크기 제한을 강제합니다.`,
        remediation: "새 업로드 경로에도 MAX_UPLOAD_BYTES 등 크기 상한을 적용하세요.",
        result: "pass",
      };
    }
    return {
      checkId, skillIds, severity: "high", title: "업로드 크기 제한",
      detail: `크기 제한이 없는 업로드 라우트: ${missing.slice(0, 8).join(", ")}`,
      remediation: "해당 라우트에 파일 크기 상한(예: MAX_UPLOAD_BYTES)을 추가해 대용량 업로드 DoS를 막으세요.",
      result: "fail",
    };
  } catch (e) {
    return {
      checkId, skillIds, severity: "high", title: "업로드 크기 제한",
      detail: `검사 실패: ${e instanceof Error ? e.message : String(e)}`,
      remediation: "업로드 라우트를 수동 확인하세요.",
      result: "warn",
    };
  }
}

export const DEFAULT_CHECK_IDS = [
  "auth.session_revoke_on_reset",
  "auth.otp_uses_csprng",
  "auth.admin_emails_configured",
  "http.csp_present",
  "http.hsts_present",
  "upload.inquiry_requires_login",
  "cron.query_secret_disabled_in_prod",
  "deps.next_auth_min_version",
  "env.auth_secret_present",
  "env.paymentwall_keys_present",
  "env.cron_secret_present",
  "deps.npm_audit_critical_high",
  // v2 스킬 기반 신규 점검팩
  "http.csp_no_unsafe_inline",
  "http.x_content_type_options",
  "http.referrer_policy",
  "http.permissions_policy",
  "cookie.session_secure_flags",
  "secrets.no_hardcoded_in_src",
  "secrets.env_gitignored",
  "data.no_passwordhash_leak",
  "bac.api_routes_authed",
  "bac.tenant_scoping",
  "ratelimit.auth_endpoints",
  "jwt.session_strategy_secret",
  "jwt.session_maxage_bounded",
  // v2 추가 방어 점검 (CORS·오픈리다이렉트·업로드)
  "http.cors_safe",
  "bac.no_open_redirect",
  "upload.size_limit_enforced",
] as const;

const RUNNERS: Record<string, () => Promise<SecurityCheckOutcome> | SecurityCheckOutcome> = {
  "auth.session_revoke_on_reset": checkSessionRevokeOnReset,
  "auth.otp_uses_csprng": checkOtpCsprng,
  "auth.admin_emails_configured": checkAdminEmails,
  "http.csp_present": checkCspPresent,
  "http.hsts_present": checkHstsPresent,
  "upload.inquiry_requires_login": checkInquiryLogin,
  "cron.query_secret_disabled_in_prod": checkCronQuerySecret,
  "deps.next_auth_min_version": checkNextAuthVersion,
  "env.auth_secret_present": checkAuthSecret,
  "env.paymentwall_keys_present": checkPaymentwallEnv,
  "env.cron_secret_present": checkCronSecretPresent,
  "deps.npm_audit_critical_high": checkNpmAuditCriticalHigh,
  // v2 스킬 기반 신규 점검팩
  "http.csp_no_unsafe_inline": checkCspNoUnsafeInline,
  "http.x_content_type_options": headerPresenceCheck(
    "http.x_content_type_options",
    "X-Content-Type-Options",
    "X-Content-Type-Options",
    "미들웨어 응답에 X-Content-Type-Options: nosniff 를 추가하세요.",
  ),
  "http.referrer_policy": headerPresenceCheck(
    "http.referrer_policy",
    "Referrer-Policy",
    "Referrer-Policy",
    "미들웨어 응답에 Referrer-Policy(예: strict-origin-when-cross-origin)를 추가하세요.",
  ),
  "http.permissions_policy": headerPresenceCheck(
    "http.permissions_policy",
    "Permissions-Policy",
    "Permissions-Policy",
    "미들웨어 응답에 Permissions-Policy로 불필요한 브라우저 기능을 차단하세요.",
  ),
  "cookie.session_secure_flags": checkSessionCookieFlagsSrc,
  "secrets.no_hardcoded_in_src": checkNoHardcodedSecrets,
  "secrets.env_gitignored": checkEnvGitignored,
  "data.no_passwordhash_leak": checkNoPasswordHashLeak,
  "bac.api_routes_authed": checkApiRoutesAuthed,
  "bac.tenant_scoping": checkTenantScoping,
  "ratelimit.auth_endpoints": checkAuthRateLimited,
  "jwt.session_strategy_secret": checkJwtStrategySecret,
  "jwt.session_maxage_bounded": checkJwtMaxAgeBounded,
  // v2 추가 방어 점검
  "http.cors_safe": checkCorsSafe,
  "bac.no_open_redirect": checkNoOpenRedirect,
  "upload.size_limit_enforced": checkUploadSizeLimit,
};

export async function runSecurityChecks(
  enabledCheckIds?: string[] | null,
): Promise<SecurityCheckOutcome[]> {
  const ids =
    enabledCheckIds && enabledCheckIds.length > 0
      ? enabledCheckIds.filter((id) => id in RUNNERS)
      : [...DEFAULT_CHECK_IDS];

  const out: SecurityCheckOutcome[] = [];
  for (const id of ids) {
    const runner = RUNNERS[id];
    if (!runner) continue;
    const outcome = await runner();
    // checkId 접두어로 도메인을 채워 대시보드 그룹핑에 쓴다.
    out.push({ ...outcome, domain: domainForCheck(outcome.checkId) });
  }
  return out;
}

export function scoreFromOutcomes(outcomes: SecurityCheckOutcome[]): number {
  if (outcomes.length === 0) return 100;
  const weight: Record<CheckResult, number> = { pass: 1, warn: 0.5, fail: 0 };
  const sum = outcomes.reduce((a, o) => a + weight[o.result], 0);
  return Math.round((sum / outcomes.length) * 100);
}

export function severityCounts(outcomes: SecurityCheckOutcome[]) {
  const open = outcomes.filter((o) => o.result !== "pass");
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const o of open) {
    counts[o.severity] += 1;
  }
  return counts;
}
