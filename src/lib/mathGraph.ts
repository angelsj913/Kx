// 수학 그래프(2D 함수 / 3D 곡면) 순수 계산 유틸 — expr-eval로 안전하게 파싱·샘플링한다.
// React/Next 의존성 없음, 서버(structured.ts의 parseMathGraph)에서만 호출된다.

import { Parser, type Expression } from "expr-eval";

const parser = new Parser();
// AI가 소문자 pi/e를 쓰는 경우도 흔해서 별칭으로 등록해둔다(기본은 대문자 PI/E).
parser.consts.pi = Math.PI;
parser.consts.e = Math.E;

export function compileExpr(expr: string): Expression | null {
  if (typeof expr !== "string" || !expr.trim()) return null;
  try {
    return parser.parse(expr);
  } catch {
    return null;
  }
}

function linspace(min: number, max: number, steps: number): number[] {
  if (steps <= 1) return [min];
  const out = new Array<number>(steps);
  const step = (max - min) / (steps - 1);
  for (let i = 0; i < steps; i++) out[i] = min + step * i;
  return out;
}

function safeEval(compiled: Expression, values: Record<string, number>): number | null {
  try {
    const v = compiled.evaluate(values);
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export function sample2D(
  expr: string,
  xRange: [number, number],
  steps = 400,
): { x: number[]; y: (number | null)[] } {
  const compiled = compileExpr(expr);
  const x = linspace(xRange[0], xRange[1], steps);
  if (!compiled) return { x, y: x.map(() => null) };
  const y = x.map((xi) => safeEval(compiled, { x: xi }));
  return { x, y };
}

export function sample3D(
  expr: string,
  xRange: [number, number],
  yRange: [number, number],
  steps = 60,
): { x: number[]; y: number[]; z: (number | null)[][] } {
  const compiled = compileExpr(expr);
  const x = linspace(xRange[0], xRange[1], steps);
  const y = linspace(yRange[0], yRange[1], steps);
  const z = y.map((yi) =>
    x.map((xi) => (compiled ? safeEval(compiled, { x: xi, y: yi }) : null)),
  );
  return { x, y, z };
}
