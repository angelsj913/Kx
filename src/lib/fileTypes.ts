// pptx/xlsx 생성 결과의 순수 데이터 타입 (서버·클라이언트 공용, 무거운 라이브러리 의존 없음)

export interface Slide {
  title: string;
  bullets?: string[];
  notes?: string;
}

export interface Deck {
  title: string;
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
  base64: string;
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
