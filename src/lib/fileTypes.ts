// pptx/xlsx 생성 결과의 순수 데이터 타입 (서버·클라이언트 공용)

/** 슬라이드 레이아웃 */
export type SlideLayout =
  | "content"
  | "agenda"
  | "section"
  | "twoColumn"
  | "closing"
  | "table"
  | "process"
  | "cycle"
  | "cards";

/** 주제 테마 (색상 프리셋 또는 커스텀 hex) */
export type ThemePreset =
  | "science"
  | "nature"
  | "medical"
  | "business"
  | "tech"
  | "education"
  | "creative"
  | "energy"
  | "finance"
  | "default";

export interface DeckTheme {
  /** 프리셋 이름 — 빌더가 팔레트 매핑 */
  preset?: ThemePreset | string;
  /** #RRGGBB 또는 RRGGBB */
  primary?: string;
  secondary?: string;
  accent?: string;
}

export interface SlideTable {
  headers: string[];
  rows: string[][];
}

export interface DiagramStep {
  label: string;
  desc?: string;
}

export interface SlideDiagram {
  /** process=가로 단계, cycle=순환, cards=카드 그리드, hierarchy=상하 */
  type: "process" | "cycle" | "cards" | "hierarchy" | string;
  steps: DiagramStep[];
}

export interface Slide {
  title: string;
  subtitle?: string;
  bullets?: string[];
  bulletsRight?: string[];
  notes?: string;
  layout?: SlideLayout;
  /** 표 데이터 */
  table?: SlideTable;
  /** 이해를 돕는 다이어그램 */
  diagram?: SlideDiagram;
}

export interface Deck {
  title: string;
  subtitle?: string;
  theme?: DeckTheme;
  slides: Slide[];
}

export interface SheetData {
  name: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface Workbook {
  title: string;
  sheets: SheetData[];
}

export interface GeneratedFile {
  url: string;
  filename: string;
  mimeType: string;
}

/** Gemini가 코드블록(```json)으로 감싸 응답해도 안전하게 JSON만 추출 */
export function extractJson(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}
