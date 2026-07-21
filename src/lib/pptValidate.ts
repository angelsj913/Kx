import type { Deck, Slide } from "./fileTypes";

export interface PptValidationIssue {
  code: string;
  message: string;
  slideIndex?: number;
}

export interface PptValidationResult {
  ok: boolean;
  issues: PptValidationIssue[];
}

function isContentSlide(s: Slide): boolean {
  const layout = s.layout ?? "content";
  return !["section", "closing", "agenda"].includes(layout);
}

function hasVisual(s: Slide): boolean {
  return !!(s.table?.rows?.length || s.diagram?.steps?.length);
}

/** PPT 덱 구조 품질 게이트 — 실패 시 1회 재생성 트리거 */
export function validateDeck(deck: Deck): PptValidationResult {
  const issues: PptValidationIssue[] = [];

  if (!deck.slides?.length) {
    issues.push({ code: "empty_slides", message: "슬라이드가 없습니다." });
    return { ok: false, issues };
  }

  if (deck.slides.length < 3) {
    issues.push({
      code: "too_few_slides",
      message: `슬라이드가 ${deck.slides.length}장뿐입니다 (최소 3장).`,
    });
  }

  if (deck.slides.length > 16) {
    issues.push({
      code: "too_many_slides",
      message: `슬라이드가 ${deck.slides.length}장입니다 (최대 16장).`,
    });
  }

  let emptyBulletSlides = 0;
  let visualSlides = 0;

  deck.slides.forEach((s, i) => {
    if (!s.title?.trim()) {
      issues.push({
        code: "missing_title",
        message: "제목이 비어 있습니다.",
        slideIndex: i,
      });
    }

    if (isContentSlide(s)) {
      const bullets = s.bullets ?? [];
      const meaningful = bullets.filter((b) => b.trim().length >= 8);
      if (meaningful.length < 2) {
        emptyBulletSlides++;
        issues.push({
          code: "sparse_bullets",
          message: "본문 bullet이 2개 미만이거나 너무 짧습니다.",
          slideIndex: i,
        });
      }
    }

    if (hasVisual(s)) visualSlides++;
  });

  const visualRatio = visualSlides / deck.slides.length;
  if (visualRatio < 0.15 && deck.slides.length >= 5) {
    issues.push({
      code: "low_visual_ratio",
      message: "표·다이어그램 슬라이드 비율이 낮습니다 (15% 미만).",
    });
  }

  if (emptyBulletSlides > Math.ceil(deck.slides.length * 0.4)) {
    issues.push({
      code: "many_empty_bullets",
      message: "빈 bullet 슬라이드가 너무 많습니다.",
    });
  }

  return { ok: issues.length === 0, issues };
}

/** XLSX JSON 최소 검증 */
export function validateWorkbook(wb: { sheets?: { name?: string; rows?: unknown[] }[] }): PptValidationResult {
  const issues: PptValidationIssue[] = [];
  if (!wb.sheets?.length) {
    issues.push({ code: "no_sheets", message: "시트가 없습니다." });
    return { ok: false, issues };
  }
  wb.sheets.forEach((s, i) => {
    if (!s.rows?.length) {
      issues.push({
        code: "empty_sheet",
        message: `시트 "${s.name ?? i + 1}"에 데이터 행이 없습니다.`,
      });
    }
  });
  return { ok: issues.length === 0, issues };
}
