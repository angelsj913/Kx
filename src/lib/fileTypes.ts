// pptx/xlsx 생성 결과의 순수 데이터 타입 (서버·클라이언트 공용, 무거운 라이브러리 의존 없음)

/** 슬라이드 레이아웃 — pptx 빌더가 시각 템플릿을 고른다 */
export type SlideLayout =
  | "content" // 제목 + 불릿 (기본)
  | "agenda" // 목차
  | "section" // 섹션 구분
  | "twoColumn" // 좌·우 불릿
  | "closing"; // 마무리·Q&A

export interface Slide {
  title: string;
  /** 부제·한 줄 요약 */
  subtitle?: string;
  bullets?: string[];
  /** twoColumn 레이아웃 오른쪽 열 */
  bulletsRight?: string[];
  notes?: string;
  layout?: SlideLayout;
}

export interface Deck {
  title: string;
  /** 표지 부제 (발표자·맥락) */
  subtitle?: string;
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
