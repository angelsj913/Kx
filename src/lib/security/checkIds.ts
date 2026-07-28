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
  "http.cors_safe",
  "bac.no_open_redirect",
  "upload.size_limit_enforced",
] as const;

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
