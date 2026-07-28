# Plan 018: PPT domain templates + research rerank

> **Drift check**: `git diff --stat HEAD -- src/lib/pptx.ts src/lib/pptTemplates.ts src/lib/pptContext.ts src/data/ppt-templates src/lib/tools.ts`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: LOW | **Depends on**: 011, 017 | **Planned at**: `0923541` | **Done**: 2026-07-28

## Why this matters

Plan 011 deferred domain template JSON. PRD §6 item 3:

| # | Item | Status |
|---|------|--------|
| 1 | RAG outline + footnotes | DONE (011) |
| 2 | User outline confirmation | future |
| 3 | **Domain template library** | **This plan** |

Also align PPT research retrieval with chat context (LLM rerank, top-3).

## Scope

**In scope:**
- `src/data/ppt-templates/{legal,startup,healthcare}.json`
- `pptTemplates.ts` — load + keyword infer
- `pptx.resolvePalette` / `inferThemePreset` prefer domain ids
- PPT instruction preset list includes domain ids
- `buildPptResearchContext` uses `rerank` + `k: 3`
- Clear unused vars lint in `security/agentRoute.ts`

**Out of scope:**
- Outline confirmation modal
- Reference PPT upload / color extraction
- Additional domains beyond the three JSON files

## Done criteria

- [x] Domain JSON templates resolve via keyword or `theme.preset`
- [x] PPT research path opts into RAG rerank
- [x] lint / tsc / eval:ai pass
