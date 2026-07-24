/**
 * expr-eval 대체 — mathjs parse/compile로 수식만 평가(코드 실행·프로토타입 오염 경로 제거).
 */
import { create, all, type MathNode } from "mathjs";

const math = create(all, {});

export type CompiledExpr = ReturnType<MathNode["compile"]>;

export function compileExpr(expr: string): CompiledExpr | null {
  if (!expr.trim()) return null;
  try {
    return math.parse(expr.trim()).compile();
  } catch {
    return null;
  }
}

export function evaluateExpr(
  expr: string,
  variables: Record<string, number> = {},
): number | null {
  try {
    const value = math.evaluate(expr.trim(), {
      ...variables,
      pi: Math.PI,
      e: Math.E,
    });
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function evaluateCompiled(
  compiled: CompiledExpr,
  variables: Record<string, number>,
): number | null {
  try {
    const value = compiled.evaluate({
      ...variables,
      pi: Math.PI,
      e: Math.E,
    });
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
