# Plan 011: PPT RAG integration + theme/animation diversity

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/lib/pptx.ts src/lib/toolGeneration.ts src/lib/tools.ts`

## Status

- **Priority**: P2 | **Effort**: L | **Risk**: MED | **Depends on**: 010 | **Planned at**: `9d8b25f`

## Why this matters

User wants PPT with varied animations/colors and topic-matched templates. PPT quality should use RAG library content when available.

## Current state

- `tools.ts` PPT_INSTRUCTION already defines `theme.preset` (science, business, etc.)
- `pptx.ts` — slide generation; validate at `pptx.ts:324`
- `toolGeneration.ts` — 2-pass outline + fill

## RAG integration (3 pillars)

1. **Outline pass** — inject top RAG chunks as bullet sources
2. **Fill pass** — footnote `[n]` per slide from chunk ids
3. **Empty library** — web search snippets from plan 010

## RAG-external quality boosts (document in PR)

1. User outline confirmation step (optional modal)
2. Reference PPT upload → extract colors/fonts
3. Domain template JSON in `data/templates/ppt/*.json`

## Scope

**In scope:**
- Wire `retrieveChunks` into PPT tool path in `toolGeneration.ts`
- `pptx.ts` — apply pptxgenjs transitions per slide type (fade, slide, zoom) varied by index
- Theme colors from JSON preset expanded per `theme.preset`

**Out of scope:**
- Reference PPT upload UI (future)
- Animation on every slide type if pptxgenjs limits — document limits

## Steps

### Step 1: RAG context in PPT pipeline

Before outline LLM call, fetch chunks for user query + attach to system prompt.

### Step 2: Transition diversity

In `pptx.ts`, map slide index → transition type rotation.

### Step 3: Theme application

Ensure `parseDeck` theme object drives master slide colors.

**Verify**: Generate PPT on topic with indexed library doc — slides reference source material

## Done criteria

- [ ] PPT tool uses RAG when chunks available
- [ ] Slides use ≥2 distinct transition types per deck
- [ ] ≥2 theme presets visibly different in test deck

## STOP conditions

- pptxgenjs version lacks transition API — report and use supported subset
