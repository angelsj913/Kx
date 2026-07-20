// math-solve 응답의 최종 답을 AI 자신의 "검산" 서술이 아니라, 서버에서 safeExpr로
// 실제 대입 계산해 기계적으로 재확인하는 순수 함수 모듈. React/Next 의존성 없음.

import { evaluateExpr } from "@/lib/safeExpr";

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

const FINAL_ANSWER_RE = /\*\*\s*답\s*:\s*\*\*\s*(.+)/;

/**
 * "**답:** ..." 줄을 뽑아 비교 가능하도록 정규화한다(공백·달러 기호·마침표 차이는
 * 무시) — 산수 검산이 불가능한 문제(증명·기하 등)에서 독립적인 2차 풀이와 최종 답이
 * 같은지 대조할 때 쓴다.
 */
export function extractFinalAnswer(text: string): string | null {
  const match = text.match(FINAL_ANSWER_RE);
  if (!match) return null;
  const normalized = match[1]
    .trim()
    .replace(/\$+/g, "")
    .replace(/\s+/g, "")
    .replace(/[.,]+$/g, "")
    .toLowerCase();
  return normalized || null;
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
    const actual = evaluateExpr(check.expr, check.variables);
    const ok =
      actual != null &&
      Math.abs(actual - check.expected) <= TOLERANCE * Math.max(1, Math.abs(check.expected));
    if (!ok) failed.push({ expr: check.expr, expected: check.expected, actual });
  }
  return { checked: checks.length, failed };
}

export interface PracticeVerifyFailure {
  index: number;
  expr: string;
  expected: number;
  actual: number | null;
}

/**
 * similar-problems(유사문제 생성) 문항별 verify 필드를 재계산해 확인한다.
 * verifyMathSolve와 같은 expr-eval 계산 방식을 재사용하되, 입력이 코드블록 하나가
 * 아니라 문항 배열에 흩어져 있다는 점만 다르다. verify가 없는 문항(산술 검산이
 * 불가능한 과목)은 조용히 건너뛴다 — 실패가 아니라 "검증 대상 아님"으로 취급.
 */
export function verifyPracticeSetProblems(
  problems: { verify: VerifyCheck | null }[],
): PracticeVerifyFailure[] {
  const failed: PracticeVerifyFailure[] = [];
  problems.forEach((p, index) => {
    if (!p.verify) return;
    const actual = evaluateExpr(p.verify.expr, p.verify.variables);
    const ok =
      actual != null &&
      Math.abs(actual - p.verify.expected) <= TOLERANCE * Math.max(1, Math.abs(p.verify.expected));
    if (!ok) failed.push({ index, expr: p.verify.expr, expected: p.verify.expected, actual });
  });
  return failed;
}
