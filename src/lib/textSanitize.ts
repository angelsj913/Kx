/**
 * Strip Hanja (CJK ideographs) from AI output as a deterministic safety net,
 * since prompt instructions alone don't reliably stop models from mixing
 * Hanja into Korean text.
 *
 * Deliberately implemented with numeric codepoint comparisons instead of a
 * regex literal containing the actual CJK characters: writing those glyphs
 * directly into source risks silent Unicode normalization remapping a
 * "compatibility ideograph" to its canonical "unified ideograph" codepoint,
 * which previously widened a range far enough to swallow all of Hangul too.
 */
const HANJA_RANGES: Array<[number, number]> = [
  [0x3400, 0x4dbf], // CJK Unified Ideographs Extension A
  [0x4e00, 0x9fff], // CJK Unified Ideographs
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
];

function isHanja(codePoint: number): boolean {
  return HANJA_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end);
}

export function stripHanja(text: string): string {
  if (!text) return text;
  let out = "";
  for (const ch of text) {
    if (!isHanja(ch.codePointAt(0) ?? 0)) out += ch;
  }
  return out.replace(/[ \t]{2,}/g, " ");
}
