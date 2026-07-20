// 수학 그래프(2D 함수 / 3D 곡면) 순수 계산 유틸 — safeExpr로 파싱·샘플링한다.
// React/Next 의존성 없음, 서버(structured.ts의 parseMathGraph)에서만 호출된다.

import {
  compileExpr,
  evaluateCompiled,
  type CompiledExpr,
} from "@/lib/safeExpr";

function linspace(min: number, max: number, steps: number): number[] {
  if (steps <= 1) return [min];
  const out = new Array<number>(steps);
  const step = (max - min) / (steps - 1);
  for (let i = 0; i < steps; i++) out[i] = min + step * i;
  return out;
}

function safeEval(compiled: CompiledExpr, values: Record<string, number>): number | null {
  return evaluateCompiled(compiled, values);
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

// ── 3D 입체(다면체) 프리미티브 생성 ──
// AI가 좌표를 직접 계산하면 복잡한 도형일수록 오류가 잦아, 표준 입체(각뿔/각기둥/
// 구/도넛 등)는 몇 개 숫자 파라미터만 받아 서버에서 정확한 메시를 계산한다.

export type Mesh3D = { vertices: [number, number, number][]; faces: [number, number, number][] };

function numOr(v: number | undefined, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function clampInt(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function generateBox(width: number, depth: number, height: number): Mesh3D {
  const w = width / 2;
  const d = depth / 2;
  const h = height;
  const vertices: [number, number, number][] = [
    [-w, -d, 0],
    [w, -d, 0],
    [w, d, 0],
    [-w, d, 0],
    [-w, -d, h],
    [w, -d, h],
    [w, d, h],
    [-w, d, h],
  ];
  const faces: [number, number, number][] = [
    [0, 1, 2],
    [0, 2, 3],
    [4, 6, 5],
    [4, 7, 6],
    [0, 5, 1],
    [0, 4, 5],
    [1, 6, 2],
    [1, 5, 6],
    [2, 7, 3],
    [2, 6, 7],
    [3, 4, 0],
    [3, 7, 4],
  ];
  return { vertices, faces };
}

/** n각뿔(밑면 n각형 + 꼭짓점 1개) — n을 크게 하면 원뿔의 근사가 된다. */
function generatePyramid(sides: number, radius: number, height: number): Mesh3D {
  const n = clampInt(sides, 3, 64);
  const vertices: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    vertices.push([radius * Math.cos(a), radius * Math.sin(a), 0]);
  }
  const apex = n;
  vertices.push([0, 0, height]);
  const faces: [number, number, number][] = [];
  for (let i = 1; i < n - 1; i++) faces.push([0, i + 1, i]);
  for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, apex]);
  return { vertices, faces };
}

/** n각기둥(밑면·윗면 n각형 + 옆면) — n을 크게 하면 원기둥의 근사가 된다. */
function generatePrism(sides: number, radius: number, height: number): Mesh3D {
  const n = clampInt(sides, 3, 64);
  const vertices: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    vertices.push([radius * Math.cos(a), radius * Math.sin(a), 0]);
  }
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    vertices.push([radius * Math.cos(a), radius * Math.sin(a), height]);
  }
  const faces: [number, number, number][] = [];
  for (let i = 1; i < n - 1; i++) faces.push([0, i + 1, i]);
  for (let i = 1; i < n - 1; i++) faces.push([n, n + i, n + i + 1]);
  for (let i = 0; i < n; i++) {
    const ni = (i + 1) % n;
    faces.push([i, ni, n + ni]);
    faces.push([i, n + ni, n + i]);
  }
  return { vertices, faces };
}

/** UV 구 — 위도(rings) x 경도(segments) 격자. 바닥이 z=0에 닿도록 z를 반지름만큼 올린다. */
function generateSphere(radius: number, segments: number, rings: number): Mesh3D {
  const segs = clampInt(segments, 3, 64);
  const rgs = clampInt(rings, 2, 64);
  const vertices: [number, number, number][] = [];
  for (let lat = 0; lat <= rgs; lat++) {
    const theta = -Math.PI / 2 + (Math.PI * lat) / rgs;
    for (let lon = 0; lon < segs; lon++) {
      const phi = (2 * Math.PI * lon) / segs;
      vertices.push([
        radius * Math.cos(theta) * Math.cos(phi),
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) + radius,
      ]);
    }
  }
  const faces: [number, number, number][] = [];
  for (let lat = 0; lat < rgs; lat++) {
    for (let lon = 0; lon < segs; lon++) {
      const a = lat * segs + lon;
      const b = lat * segs + ((lon + 1) % segs);
      const c = (lat + 1) * segs + ((lon + 1) % segs);
      const d = (lat + 1) * segs + lon;
      faces.push([a, b, c]);
      faces.push([a, c, d]);
    }
  }
  return { vertices, faces };
}

/** 도넛(토러스) — 큰 반지름(major) 경로를 따라 작은 반지름(tube)의 원을 돌린다. */
function generateTorus(major: number, tube: number, segments: number, rings: number): Mesh3D {
  const segs = clampInt(segments, 3, 64);
  const rgs = clampInt(rings, 3, 64);
  const vertices: [number, number, number][] = [];
  for (let i = 0; i < segs; i++) {
    const u = (2 * Math.PI * i) / segs;
    for (let j = 0; j < rgs; j++) {
      const v = (2 * Math.PI * j) / rgs;
      vertices.push([
        (major + tube * Math.cos(v)) * Math.cos(u),
        (major + tube * Math.cos(v)) * Math.sin(u),
        tube * Math.sin(v) + tube,
      ]);
    }
  }
  const faces: [number, number, number][] = [];
  for (let i = 0; i < segs; i++) {
    const ni = (i + 1) % segs;
    for (let j = 0; j < rgs; j++) {
      const nj = (j + 1) % rgs;
      const a = i * rgs + j;
      const b = ni * rgs + j;
      const c = ni * rgs + nj;
      const d = i * rgs + nj;
      faces.push([a, b, c]);
      faces.push([a, c, d]);
    }
  }
  return { vertices, faces };
}

export interface PrimitiveParams {
  type: string;
  width?: number;
  depth?: number;
  height?: number;
  radius?: number;
  sides?: number;
  segments?: number;
  rings?: number;
  tube?: number;
}

/** 인식하지 못하는 type이면 null — 호출부(structured.ts)가 커스텀 vertices/faces로 폴백한다. */
export function generatePrimitive(p: PrimitiveParams): Mesh3D | null {
  switch (p.type) {
    case "box":
      return generateBox(numOr(p.width, 10), numOr(p.depth, 10), numOr(p.height, 10));
    case "pyramid":
    case "cone":
      return generatePyramid(
        numOr(p.sides, p.type === "cone" ? 32 : 4),
        numOr(p.radius, 5),
        numOr(p.height, 10),
      );
    case "prism":
    case "cylinder":
      return generatePrism(
        numOr(p.sides, p.type === "cylinder" ? 32 : 6),
        numOr(p.radius, 5),
        numOr(p.height, 10),
      );
    case "sphere":
      return generateSphere(numOr(p.radius, 5), numOr(p.segments, 24), numOr(p.rings, 16));
    case "torus":
      return generateTorus(
        numOr(p.radius, 5),
        numOr(p.tube, 2),
        numOr(p.segments, 24),
        numOr(p.rings, 16),
      );
    default:
      return null;
  }
}
