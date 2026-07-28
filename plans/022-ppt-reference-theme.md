# Plan 022: Reference PPT theme extract

> **Drift check**: `git diff --stat HEAD -- src/lib/pptThemeExtract.ts src/lib/toolGeneration.ts src/app/api/chat/route.ts`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: LOW | **Depends on**: 011, 019 | **Planned at**: `b727628` | **Done**: 2026-07-28

## Why this matters

Plan 011 deferred “Reference PPT upload → extract colors/fonts”. Users can attach a branded `.pptx` so generated decks inherit brand colors through existing `DeckTheme` / `resolvePalette`.

## Scope

**In scope:**
- Parse OOXML `ppt/theme/theme*.xml` clrScheme via JSZip
- Chat PPT path: detect attached `.pptx` → `themeOverride`
- Persist colors on `pptOutline` draft through confirm→fill
- PPT tool `acceptFiles` includes `.pptx`

**Out of scope:**
- Full font plumbing across all pptxgenjs call sites (colors only)
- Separate upload API
- Sending pptx binary to Gemini as an image

## Done criteria

- [x] `extractThemeFromPptx` + scheme goldens
- [x] Outline/fill/full merge extracted hex into deck.theme
- [x] lint / tsc / eval:ai pass
