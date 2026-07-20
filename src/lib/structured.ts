// 신규 구조화 도구(회의록/주간보고/강의노트/레포트 초안)의 데이터 타입 + AI 응답 파싱.
// pptx.ts/xlsx.ts와 동일한 패턴: extractJson으로 코드블록을 벗기고 JSON.parse.

import { extractJson } from "./fileTypes";
import { sample2D, sample3D, generatePrimitive } from "./mathGraph";

export type StructuredKind =
  | "meeting"
  | "weeklyReport"
  | "lectureNotes"
  | "researchDraft"
  | "examAnalysis"
  | "practiceSet"
  | "mathGraph"
  | "mindMap";

// ── 회의록 ──

export interface ActionItem {
  task: string;
  assignee: string;
  dueDate: string;
}

export interface MeetingMinutes {
  date: string;
  attendees: string[];
  agenda: string;
  actionItems: ActionItem[];
}

export function parseMeetingMinutes(raw: string): MeetingMinutes {
  const obj = JSON.parse(extractJson(raw));
  return {
    date: typeof obj?.date === "string" ? obj.date : "",
    attendees: Array.isArray(obj?.attendees)
      ? (obj.attendees as unknown[]).map((a) => String(a))
      : [],
    agenda: typeof obj?.agenda === "string" ? obj.agenda : "",
    actionItems: Array.isArray(obj?.actionItems)
      ? (obj.actionItems as unknown[]).map((a) => {
          const item = a as Record<string, unknown>;
          return {
            task: typeof item?.task === "string" ? item.task : "",
            assignee: typeof item?.assignee === "string" ? item.assignee : "",
            dueDate: typeof item?.dueDate === "string" ? item.dueDate : "",
          };
        })
      : [],
  };
}

// ── 주간 업무 보고 ──

export interface WeeklyReportItem {
  item: string;
  progress: number; // 0-100
}

export interface WeeklyReport {
  thisWeek: WeeklyReportItem[];
  nextWeek: WeeklyReportItem[];
}

function toItems(v: unknown): WeeklyReportItem[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[]).map((x) => {
    const o = x as Record<string, unknown>;
    const progress = typeof o?.progress === "number" ? o.progress : Number(o?.progress);
    return {
      item: typeof o?.item === "string" ? o.item : "",
      progress: Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0,
    };
  });
}

export function parseWeeklyReport(raw: string): WeeklyReport {
  const obj = JSON.parse(extractJson(raw));
  return {
    thisWeek: toItems(obj?.thisWeek),
    nextWeek: toItems(obj?.nextWeek),
  };
}

// ── 강의 요약 노트 ──

export interface LectureConcept {
  cue: string;
  detail: string;
}

export interface LectureNotes {
  concepts: LectureConcept[];
  transcript: string;
  summaryLines: string[];
}

export function parseLectureNotes(raw: string): LectureNotes {
  const obj = JSON.parse(extractJson(raw));
  return {
    concepts: Array.isArray(obj?.concepts)
      ? (obj.concepts as unknown[]).map((c) => {
          const o = c as Record<string, unknown>;
          return {
            cue: typeof o?.cue === "string" ? o.cue : "",
            detail: typeof o?.detail === "string" ? o.detail : "",
          };
        })
      : [],
    transcript: typeof obj?.transcript === "string" ? obj.transcript : "",
    summaryLines: Array.isArray(obj?.summaryLines)
      ? (obj.summaryLines as unknown[]).map((s) => String(s)).slice(0, 3)
      : [],
  };
}

// ── 레포트 / 논문 초안 ──

export interface ResearchSection {
  heading: string;
  body: string;
}

export interface Citation {
  source: string;
  author: string;
  note: string;
}

export interface ResearchDraft {
  sections: ResearchSection[];
  citations: Citation[];
}

export function parseResearchDraft(raw: string): ResearchDraft {
  const obj = JSON.parse(extractJson(raw));
  return {
    sections: Array.isArray(obj?.sections)
      ? (obj.sections as unknown[]).map((s) => {
          const o = s as Record<string, unknown>;
          return {
            heading: typeof o?.heading === "string" ? o.heading : "",
            body: typeof o?.body === "string" ? o.body : "",
          };
        })
      : [],
    citations: Array.isArray(obj?.citations)
      ? (obj.citations as unknown[]).map((c) => {
          const o = c as Record<string, unknown>;
          return {
            source: typeof o?.source === "string" ? o.source : "",
            author: typeof o?.author === "string" ? o.author : "",
            note: typeof o?.note === "string" ? o.note : "",
          };
        })
      : [],
  };
}

// ── 시험지 분석 ──

export interface ExamQuestionAnalysis {
  number: string;
  topic: string;
  difficulty: string;
  keyPoint: string;
}

export interface ExamAnalysis {
  examTitle: string;
  subject: string;
  overallDifficulty: string;
  summary: string;
  questions: ExamQuestionAnalysis[];
}

export function parseExamAnalysis(raw: string): ExamAnalysis {
  const obj = JSON.parse(extractJson(raw));
  return {
    examTitle: typeof obj?.examTitle === "string" ? obj.examTitle : "",
    subject: typeof obj?.subject === "string" ? obj.subject : "",
    overallDifficulty: typeof obj?.overallDifficulty === "string" ? obj.overallDifficulty : "",
    summary: typeof obj?.summary === "string" ? obj.summary : "",
    questions: Array.isArray(obj?.questions)
      ? (obj.questions as unknown[]).map((q) => {
          const o = q as Record<string, unknown>;
          return {
            number: typeof o?.number === "string" ? o.number : String(o?.number ?? ""),
            topic: typeof o?.topic === "string" ? o.topic : "",
            difficulty: typeof o?.difficulty === "string" ? o.difficulty : "",
            keyPoint: typeof o?.keyPoint === "string" ? o.keyPoint : "",
          };
        })
      : [],
  };
}

// ── 전과목 유사문제 생성 ──

/** 산술로 검산 가능한 문제에만 채워진다 — 서버가 expr-eval로 재계산해 정답을 확인한다. */
export interface PracticeProblemVerify {
  expr: string;
  variables: Record<string, number>;
  expected: number;
}

export interface PracticeProblem {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  verify: PracticeProblemVerify | null;
}

export interface PracticeSet {
  subject: string;
  problems: PracticeProblem[];
}

function parsePracticeVerify(raw: unknown): PracticeProblemVerify | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const expr = typeof o?.expr === "string" ? o.expr : "";
  const expected = Number(o?.expected);
  if (!expr || !Number.isFinite(expected)) return null;
  const variables: Record<string, number> = {};
  if (o?.variables && typeof o.variables === "object") {
    for (const [k, v] of Object.entries(o.variables as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n)) variables[k] = n;
    }
  }
  return { expr, variables, expected };
}

export function parsePracticeSet(raw: string): PracticeSet {
  const obj = JSON.parse(extractJson(raw));
  return {
    subject: typeof obj?.subject === "string" ? obj.subject : "",
    problems: Array.isArray(obj?.problems)
      ? (obj.problems as unknown[]).map((p) => {
          const o = p as Record<string, unknown>;
          return {
            question: typeof o?.question === "string" ? o.question : "",
            choices: Array.isArray(o?.choices)
              ? (o.choices as unknown[]).map((c) => String(c))
              : [],
            answer: typeof o?.answer === "string" ? o.answer : "",
            explanation: typeof o?.explanation === "string" ? o.explanation : "",
            verify: parsePracticeVerify(o?.verify),
          };
        })
      : [],
  };
}

// ── 수학 그래프 (2D 함수 / 3D 곡면) ──

export interface GraphFunction2D {
  expr: string;
  label: string;
  x: number[];
  y: (number | null)[];
}

export interface GraphSurface3D {
  expr: string;
  label: string;
  x: number[];
  y: number[];
  z: (number | null)[][];
}

/** 함수로 표현되지 않는 3D 도형(삼각뿔·정육면체 등 다면체) — 꼭짓점 + 삼각형 면. */
export interface GraphSolid3D {
  label: string;
  vertices: [number, number, number][];
  faces: [number, number, number][];
  color: string;
}

export interface MathGraph {
  mode: "2d" | "3d" | "solid";
  title: string;
  functions: GraphFunction2D[];
  surface: GraphSurface3D | null;
  solid: GraphSolid3D | null;
  xRange: [number, number];
  yRange: [number, number];
  zRange: [number, number] | null;
}

function toRangePair(v: unknown, fallback: [number, number]): [number, number] {
  if (Array.isArray(v) && v.length === 2) {
    const a = Number(v[0]);
    const b = Number(v[1]);
    if (Number.isFinite(a) && Number.isFinite(b) && a < b) return [a, b];
  }
  return fallback;
}

/** 유한한 값들의 최소/최대에 여백을 둔 범위 — 없으면 fallback. */
function autoFitRange(values: number[], fallback: [number, number]): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return fallback;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.1;
  return [min - pad, max + pad];
}

function toVector3(v: unknown): [number, number, number] | null {
  if (!Array.isArray(v) || v.length !== 3) return null;
  const [a, b, c] = v.map(Number);
  if (![a, b, c].every(Number.isFinite)) return null;
  return [a, b, c];
}

function toIndexTriple(v: unknown, vertexCount: number): [number, number, number] | null {
  if (!Array.isArray(v) || v.length !== 3) return null;
  const [a, b, c] = v.map((x) => Math.trunc(Number(x)));
  if (![a, b, c].every((n) => Number.isInteger(n) && n >= 0 && n < vertexCount)) return null;
  return [a, b, c];
}

/**
 * 구는 z=f(x,y) 형태의 단일 곡면으로 표현할 수 없어(위쪽 절반만 나오는 반구가 되고,
 * 정의역 경계에서 톱니 모양이 생김) AI가 실수로 3D 곡면 모드로 만드는 경우가 있다.
 * x²+y²+z²가 표본 전체에서 거의 일정하고 z≥0이면 반구로 보고 반지름을 구해 돌려준다.
 */
function detectHemisphereRadius(x: number[], y: number[], z: (number | null)[][]): number | null {
  const r2Samples: number[] = [];
  for (let yi = 0; yi < z.length; yi++) {
    for (let xi = 0; xi < z[yi].length; xi++) {
      const zi = z[yi][xi];
      if (zi == null) continue;
      if (zi < -1e-6) return null;
      r2Samples.push(x[xi] * x[xi] + y[yi] * y[yi] + zi * zi);
    }
  }
  if (r2Samples.length < 20) return null;
  const mean = r2Samples.reduce((a, b) => a + b, 0) / r2Samples.length;
  if (mean <= 0) return null;
  const maxDeviation = Math.max(...r2Samples.map((s) => Math.abs(s - mean) / mean));
  return maxDeviation <= 0.03 ? Math.sqrt(mean) : null;
}

const SOLID_CAP = 20000;

function parseSolid(raw: unknown): GraphSolid3D | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const label = typeof o?.label === "string" ? o.label : "";
  const color = typeof o?.color === "string" && o.color.trim() ? o.color : "gray";

  // 표준 입체(정육면체/각뿔/각기둥/구/도넛)는 AI가 좌표를 직접 계산하지 않고
  // 몇 개 숫자 파라미터만 주면 서버에서 정확한 메시를 만든다 — 훨씬 안정적이다.
  if (o?.primitive && typeof o.primitive === "object") {
    const p = o.primitive as Record<string, unknown>;
    const mesh = generatePrimitive({
      type: typeof p?.type === "string" ? p.type : "",
      width: Number(p?.width),
      depth: Number(p?.depth),
      height: Number(p?.height),
      radius: Number(p?.radius),
      sides: Number(p?.sides),
      segments: Number(p?.segments),
      rings: Number(p?.rings),
      tube: Number(p?.tube),
    });
    if (mesh) return { label, vertices: mesh.vertices, faces: mesh.faces, color };
    // 인식 못 하는 primitive.type이면 커스텀 vertices/faces로 폴백.
  }

  const vertices = Array.isArray(o?.vertices)
    ? (o.vertices as unknown[])
        .slice(0, SOLID_CAP)
        .map(toVector3)
        .filter((v): v is [number, number, number] => v !== null)
    : [];
  if (vertices.length < 3) return null;
  const faces = Array.isArray(o?.faces)
    ? (o.faces as unknown[])
        .slice(0, SOLID_CAP)
        .map((f) => toIndexTriple(f, vertices.length))
        .filter((f): f is [number, number, number] => f !== null)
    : [];
  if (!faces.length) return null;
  return { label, vertices, faces, color };
}

// ── 마인드맵 ──

export interface MindMapNode {
  label: string;
  children: MindMapNode[];
}

export interface MindMap {
  title: string;
  root: MindMapNode;
}

const MINDMAP_MAX_DEPTH = 4;
const MINDMAP_MAX_CHILDREN = 8;
const MINDMAP_MAX_NODES = 80;

function parseMindMapNode(
  raw: unknown,
  depth: number,
  budget: { count: number },
): MindMapNode {
  const o = (raw ?? {}) as Record<string, unknown>;
  const label = typeof o.label === "string" ? o.label.trim().slice(0, 120) : "";
  const children: MindMapNode[] = [];
  if (depth < MINDMAP_MAX_DEPTH && Array.isArray(o.children)) {
    for (const child of o.children as unknown[]) {
      if (budget.count >= MINDMAP_MAX_NODES) break;
      if (children.length >= MINDMAP_MAX_CHILDREN) break;
      budget.count += 1;
      const node = parseMindMapNode(child, depth + 1, budget);
      if (node.label) children.push(node);
    }
  }
  return { label, children };
}

export function parseMindMap(raw: string): MindMap {
  const obj = JSON.parse(extractJson(raw));
  const title = typeof obj?.title === "string" ? obj.title.trim().slice(0, 120) : "";
  const budget = { count: 1 };
  const rootRaw = obj?.root ?? { label: title, children: obj?.children ?? [] };
  const root = parseMindMapNode(rootRaw, 0, budget);
  if (!root.label) root.label = title || "마인드맵";
  return { title: title || root.label, root };
}

/** 루트에 자식이 하나도 없으면 "빈 마인드맵" — 호출부에서 재시도/에러 처리용. */
export function isEmptyMindMap(data: MindMap): boolean {
  return data.root.children.length === 0;
}

export function parseMathGraph(raw: string): MathGraph {
  const obj = JSON.parse(extractJson(raw));
  let mode: "2d" | "3d" | "solid" =
    obj?.mode === "solid" ? "solid" : obj?.mode === "3d" ? "3d" : "2d";
  const title = typeof obj?.title === "string" ? obj.title : "";
  let xRange = toRangePair(obj?.xRange, [-10, 10]);
  // yRange는 3D에서는 y 변수의 정의역으로도 쓰이므로 AI 제안값을 그대로 둔다.
  let yRange = toRangePair(obj?.yRange, [-10, 10]);
  let zRange = obj?.zRange == null ? null : toRangePair(obj?.zRange, [-10, 10]);

  const functions: GraphFunction2D[] =
    mode === "2d" && Array.isArray(obj?.functions)
      ? (obj.functions as unknown[])
          .slice(0, 5)
          .map((f) => {
            const o = f as Record<string, unknown>;
            const expr = typeof o?.expr === "string" ? o.expr : "";
            const label = typeof o?.label === "string" ? o.label : expr;
            const { x, y } = sample2D(expr, xRange);
            return { expr, label, x, y };
          })
          .filter((f) => f.expr)
      : [];

  // 2D 표시 범위는 AI가 추측한 값 대신, 실제로 샘플링된 y값의 최소/최대로 자동 계산한다.
  // 이렇게 해야 꼭짓점·근 등 그래프 전체 모양이 항상 한 화면에 들어온다.
  if (mode === "2d" && functions.length) {
    const allY = functions.flatMap((f) => f.y).filter((v): v is number => v != null);
    yRange = autoFitRange(allY, yRange);
  }

  let surface: GraphSurface3D | null = null;
  let solid: GraphSolid3D | null = null;
  if (mode === "3d" && obj?.surface && typeof obj.surface === "object") {
    const o = obj.surface as Record<string, unknown>;
    const expr = typeof o?.expr === "string" ? o.expr : "";
    const label = typeof o?.label === "string" ? o.label : expr;
    if (expr) {
      const { x, y, z } = sample3D(expr, xRange, yRange);
      const sphereRadius = detectHemisphereRadius(x, y, z);
      const sphereMesh =
        sphereRadius != null ? generatePrimitive({ type: "sphere", radius: sphereRadius }) : null;
      if (sphereMesh) {
        mode = "solid";
        solid = { label: label || "구", vertices: sphereMesh.vertices, faces: sphereMesh.faces, color: "gray" };
      } else {
        surface = { expr, label, x, y, z };
      }
    }
  }

  if (mode === "solid" && !solid) {
    solid = parseSolid(obj?.solid);
  }
  if (solid) {
    // 꼭짓점 좌표 범위에서 자동으로 프레임을 계산해 도형 전체가 항상 화면에 들어오게 한다.
    xRange = autoFitRange(solid.vertices.map((v) => v[0]), xRange);
    yRange = autoFitRange(solid.vertices.map((v) => v[1]), yRange);
    zRange = autoFitRange(solid.vertices.map((v) => v[2]), zRange ?? [-10, 10]);
  }

  return { mode, title, functions, surface, solid, xRange, yRange, zRange };
}

/**
 * mode에 맞는 실제 표시 데이터(2D 함수·3D 곡면·입체 도형)가 하나도 없는 "빈 그래프"인지
 * 판정한다. AI가 expr을 빈 문자열로 주거나 파싱이 실패하면 parseMathGraph는 조용히
 * null/빈 배열을 반환하는데, 그대로 두면 트레이스 0개짜리 빈 차트가 "성공"으로
 * 저장된다 — 호출부에서 이 판정으로 실패를 감지해 재시도/에러 처리할 수 있게 한다.
 */
export function isEmptyMathGraph(data: MathGraph): boolean {
  if (data.mode === "2d") return data.functions.length === 0;
  if (data.mode === "3d") return !data.surface;
  return !data.solid;
}

export type StructuredData =
  | { kind: "meeting"; data: MeetingMinutes }
  | { kind: "weeklyReport"; data: WeeklyReport }
  | { kind: "lectureNotes"; data: LectureNotes }
  | { kind: "researchDraft"; data: ResearchDraft }
  | { kind: "examAnalysis"; data: ExamAnalysis }
  | { kind: "practiceSet"; data: PracticeSet }
  | { kind: "mathGraph"; data: MathGraph }
  | { kind: "mindMap"; data: MindMap };

export function parseStructured(kind: StructuredKind, raw: string): StructuredData {
  switch (kind) {
    case "meeting":
      return { kind, data: parseMeetingMinutes(raw) };
    case "weeklyReport":
      return { kind, data: parseWeeklyReport(raw) };
    case "lectureNotes":
      return { kind, data: parseLectureNotes(raw) };
    case "researchDraft":
      return { kind, data: parseResearchDraft(raw) };
    case "examAnalysis":
      return { kind, data: parseExamAnalysis(raw) };
    case "practiceSet":
      return { kind, data: parsePracticeSet(raw) };
    case "mathGraph":
      return { kind, data: parseMathGraph(raw) };
    case "mindMap":
      return { kind, data: parseMindMap(raw) };
  }
}
