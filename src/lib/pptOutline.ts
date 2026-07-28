/**
 * PPT 아웃라인(확인 단계) — fill 전에 사용자 편집용 스키마.
 * (plan 019)
 */
import { extractJson } from "./fileTypes";

export interface PptOutlineSlide {
  layout: string;
  title: string;
  subtitle: string;
}

export interface PptOutlineDraft {
  title: string;
  subtitle: string;
  themePreset: string;
  slides: PptOutlineSlide[];
  /** fill 시 원 요청문 — UI에는 숨김, autosave 포함 */
  sourceText: string;
  /** Reference PPT에서 추출한 색/글꼴 (fill까지 유지) */
  primary?: string;
  secondary?: string;
  accent?: string;
  fontFace?: string;
}

function asSlide(v: unknown): PptOutlineSlide {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    layout: typeof o.layout === "string" && o.layout.trim() ? o.layout.trim() : "content",
    title: typeof o.title === "string" ? o.title : "",
    subtitle: typeof o.subtitle === "string" ? o.subtitle : "",
  };
}

/** AI 아웃라인 JSON 또는 저장된 draft → PptOutlineDraft */
export function parsePptOutline(raw: string, sourceText = ""): PptOutlineDraft {
  const obj = JSON.parse(extractJson(raw)) as Record<string, unknown>;
  const theme = (obj.theme ?? {}) as Record<string, unknown>;
  const preset =
    typeof theme.preset === "string"
      ? theme.preset
      : typeof obj.themePreset === "string"
        ? obj.themePreset
        : "default";
  const slides = Array.isArray(obj.slides) ? obj.slides.map(asSlide) : [];
  const src =
    typeof obj.sourceText === "string" && obj.sourceText.trim()
      ? obj.sourceText
      : sourceText;
  return {
    title: typeof obj.title === "string" ? obj.title : "",
    subtitle: typeof obj.subtitle === "string" ? obj.subtitle : "",
    themePreset: preset || "default",
    slides,
    sourceText: src,
    primary: typeof obj.primary === "string" ? obj.primary : typeof theme.primary === "string" ? theme.primary : undefined,
    secondary:
      typeof obj.secondary === "string"
        ? obj.secondary
        : typeof theme.secondary === "string"
          ? theme.secondary
          : undefined,
    accent: typeof obj.accent === "string" ? obj.accent : typeof theme.accent === "string" ? theme.accent : undefined,
    fontFace:
      typeof obj.fontFace === "string"
        ? obj.fontFace
        : typeof theme.fontFace === "string"
          ? theme.fontFace
          : undefined,
  };
}

/** fill 프롬프트에 넣을 아웃라인 JSON (sourceText 제외) */
export function formatOutlineForFill(draft: PptOutlineDraft): string {
  return JSON.stringify({
    title: draft.title,
    subtitle: draft.subtitle,
    theme: {
      preset: draft.themePreset,
      ...(draft.primary ? { primary: draft.primary } : {}),
      ...(draft.secondary ? { secondary: draft.secondary } : {}),
      ...(draft.accent ? { accent: draft.accent } : {}),
      ...(draft.fontFace ? { fontFace: draft.fontFace } : {}),
    },
    slides: draft.slides.map((s) => ({
      layout: s.layout,
      title: s.title,
      subtitle: s.subtitle,
    })),
  });
}
