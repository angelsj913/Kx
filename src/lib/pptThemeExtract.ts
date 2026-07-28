/**
 * Reference .pptx → theme colors (plan 022).
 * OOXML `ppt/theme/theme*.xml` clrScheme 파싱 (JSZip).
 */
import JSZip from "jszip";
import type { DeckTheme } from "@/lib/fileTypes";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export function isPptxAttachment(mimeType: string, filename?: string): boolean {
  const mime = (mimeType || "").toLowerCase();
  if (mime.includes("presentationml") || mime === PPTX_MIME) return true;
  const name = (filename || "").toLowerCase();
  return name.endsWith(".pptx");
}

function normalizeHex(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim().replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{3}$/.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return /^[0-9A-F]{6}$/.test(s) ? s : undefined;
}

/** theme XML에서 scheme 슬롯 → srgb hex */
export function parseClrSchemeFromThemeXml(xml: string): Record<string, string> {
  const out: Record<string, string> = {};
  // <a:accent1>…<a:srgbClr val="2563EB"/>…</a:accent1>
  const slotRe =
    /<a:(dk1|lt1|dk2|lt2|accent[1-6]|hlink|folHlink)\b[^>]*>([\s\S]*?)<\/a:\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = slotRe.exec(xml))) {
    const slot = m[1]!.toLowerCase();
    const body = m[2] ?? "";
    const srgb = body.match(/srgbClr[^>]*\bval="([0-9A-Fa-f]{6})"/i);
    const hex = normalizeHex(srgb?.[1]);
    if (hex) out[slot] = hex;
  }
  return out;
}

export function parseLatinFontFromThemeXml(xml: string): string | undefined {
  const major = xml.match(
    /<a:majorFont>[\s\S]*?<a:latin[^>]*\btypeface="([^"]+)"/i,
  );
  if (major?.[1]?.trim()) return major[1].trim();
  const any = xml.match(/<a:latin[^>]*\btypeface="([^"]+)"/i);
  return any?.[1]?.trim() || undefined;
}

export function schemeToDeckTheme(
  scheme: Record<string, string>,
  fontFace?: string,
): DeckTheme & { fontFace?: string } {
  const primary = scheme.accent1 || scheme.dk2 || scheme.dk1;
  const secondary = scheme.dk2 || scheme.dk1 || scheme.accent2;
  const accent = scheme.accent2 || scheme.accent3 || scheme.accent1;
  const theme: DeckTheme & { fontFace?: string } = {
    preset: "default",
  };
  if (primary) theme.primary = primary;
  if (secondary) theme.secondary = secondary;
  if (accent) theme.accent = accent;
  if (fontFace) theme.fontFace = fontFace;
  return theme;
}

/**
 * pptx buffer에서 clrScheme 기반 DeckTheme 추출.
 * theme XML이 없거나 색이 없으면 null.
 */
export async function extractThemeFromPptx(
  buf: Buffer,
): Promise<(DeckTheme & { fontFace?: string }) | null> {
  try {
    const zip = await JSZip.loadAsync(buf);
    const themePath =
      Object.keys(zip.files).find((p) => /^ppt\/theme\/theme\d+\.xml$/i.test(p)) ??
      "ppt/theme/theme1.xml";
    const file = zip.file(themePath);
    if (!file) return null;
    const xml = await file.async("string");
    const scheme = parseClrSchemeFromThemeXml(xml);
    if (!Object.keys(scheme).length) return null;
    const fontFace = parseLatinFontFromThemeXml(xml);
    const theme = schemeToDeckTheme(scheme, fontFace);
    if (!theme.primary && !theme.secondary && !theme.accent) return null;
    return theme;
  } catch (err) {
    console.warn("[pptThemeExtract] failed", err);
    return null;
  }
}
