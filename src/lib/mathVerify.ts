// math-solve 응답의 최종 답을 AI 자신의 "검산" 서술이 아니라, 서버에서 expr-eval로
// 실제 대입 계산해 기계적으로 재확인하는 순수 함수 모듈. React/Next 의존성 없음.

import { Parser } from "expr-eval";

const parser = new Parser();
parser.consts.pi = Math.PI;
parser.consts.e = Math.E;

export interface VerifyCheck {
  expr: string;
  variables: Record<string, number>;
  expected: number;
}

export interface VerifyResult {
  checked: number;
  failed: { expr: string; expected: number; actual: number | null }[];
}

const VERIFY_BLOCK_RE = /```verify\s*([\s\S]*?)```/i;

function toChecks(parsed: unknown): VerifyCheck[] {
  const raw = Array.isArray((parsed as { checks?: unknown })?.checks)
    ? (parsed as { checks: unknown[] }).checks
    : [];
  const out: VerifyCheck[] = [];
  for (const c of raw) {
    const o = c as Record<string, unknown>;
    const expr = typeof o?.expr === "string" ? o.expr : "";
    const expected = Number(o?.expected);
    if (!expr || !Number.isFinite(expected)) continue;
    const variables: Record<string, number> = {};
    if (o?.variables && typeof o.variables === "object") {
      for (const [k, v] of Object.entries(o.variables as Record<string, unknown>)) {
        const n = Number(v);
        if (Number.isFinite(n)) variables[k] = n;
      }
    }
    out.push({ expr, variables, expected });
  }
  return out;
}

/** raw 안에서 ```verify 블록을 찾아 파싱한다. 블록이 없으면 null. */
function extractChecks(raw: string): VerifyCheck[] | null {
  const match = raw.match(VERIFY_BLOCK_RE);
  if (!match) return null;
  try {
    return toChecks(JSON.parse(match[1].trim()));
  } catch {
    return null;
  }
}

/** 사용자에게 보이면 안 되는 검산용 JSON 블록을 최종 텍스트에서 제거한다. */
export function stripVerifyBlock(raw: string): string {
  return raw.replace(VERIFY_BLOCK_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

const TOLERANCE = 1e-4;

/**
 * math-solve 응답에 포함된 ```verify 블록을 실제로 계산해 AI의 최종 답이 맞는지
 * 재확인한다. 블록이 없거나(비어 있거나) 파싱에 실패하면 null을 반환한다 — 증명형
 * 문제처럼 애초에 수치 검산이 불가능한 경우와, 형식이 깨진 경우를 구분하지 않고
 * 둘 다 "검증 불가(실패 아님)"로 취급한다.
 */
export function verifyMathSolve(raw: string): VerifyResult | null {
  const checks = extractChecks(raw);
  if (checks == null || checks.length === 0) return null;

  const failed: VerifyResult["failed"] = [];
  for (const check of checks) {
    let actual: number | null = null;
    try {
      const value = parser.parse(check.expr).evaluate(check.variables);
      actual = typeof value === "number" && Number.isFinite(value) ? value : null;
    } catch {
      actual = null;
    }
    const ok =
      actual != null &&
      Math.abs(actual - check.expected) <= TOLERANCE * Math.max(1, Math.abs(check.expected));
    if (!ok) failed.push({ expr: check.expr, expected: check.expected, actual });
  }
  return { checked: checks.length, failed };
}
