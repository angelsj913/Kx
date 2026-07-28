# Plan 019: PPT outline confirmation step

> **Drift check**: `git diff --stat HEAD -- src/lib/toolGeneration.ts src/lib/pptOutline.ts src/components/structured/PptOutlineView.tsx src/app/api/chat/route.ts`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: MED | **Depends on**: 011, 018 | **Planned at**: `29a4b90` | **Done**: 2026-07-28

## Why this matters

Plan 011 deferred “optional user outline confirmation”. Users should review slide titles/layouts before the expensive fill pass.

## Scope

**In scope:**
- Split PPT generation: `outline` → structured `pptOutline` → user confirm → `fill` → `.pptx`
- Inline editable outline panel (`PptOutlineView`) + CTA
- Fill continuation skips pptx quota re-charge
- Agent/`zeff_tool` path stays `full` (no pause)

**Out of scope:**
- Reference PPT upload
- Holding NDJSON stream open for confirm
- Skipping outline for a settings toggle (always on for chat PPT tool)

## Done criteria

- [x] Chat PPT tool returns editable outline before file
- [x] Confirm builds pptx from edited outline
- [x] Golden `ppt_outline_parse` cases
- [x] lint / tsc / eval:ai pass
