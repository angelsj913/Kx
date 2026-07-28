# Plan 023: Reference PPT fontFace plumbing

> **Drift check**: `git diff --stat HEAD -- src/lib/pptx.ts src/lib/pptOutline.ts src/lib/toolGeneration.ts`

## Status

- **Priority**: P2 | **Effort**: S | **Risk**: LOW | **Depends on**: 022 | **Planned at**: `90a6f50` | **Done**: 2026-07-28

## Why this matters

Plan 022 extracts major Latin `typeface` from OOXML theme but generation still hardcodes Malgun Gothic. Brand decks should inherit the reference font when present.

## Scope

**In scope:**
- `resolveFontFace` + attach to `ResolvedPalette`
- All `pptx.ts` text runs use `pal.fontFace`
- Persist `fontFace` on outline draft → fill theme merge
- Eval golden for Latin font parse

**Out of scope:**
- Embedding custom font binaries into pptx
- Mapping Office theme `+mj-lt` placeholders to real faces

## Done criteria

- [x] `deck.theme.fontFace` drives pptxgenjs `fontFace`
- [x] Outline confirm → fill keeps fontFace
- [x] lint / tsc / eval:ai pass
