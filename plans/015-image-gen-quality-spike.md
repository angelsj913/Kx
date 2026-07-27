# Plan 015: Image generation quality spike (APPROVAL GATE)

> **Status**: **DONE** — approved via roadmap continuation 2026-07-27.

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: MED | **Planned at**: `9d8b25f` | **Done**: 2026-07-27

## Why this matters

User reported “멀티툴 이미지를 그려줘” produced unrelated still-life. Root cause likely Pollinations prompt drift + weak tool-specific prefix in `toolGeneration.ts`.

## Current pipeline (for executor after approval)

1. `image-gen` tool → `imageGenerationCandidates()` in `models.ts`
2. Pollinations (free) → Gemini → OpenRouter fallbacks
3. Post-process 2× Lanczos upscale always applied

## Proposed spike (post-approval)

1. **Prompt envelope** — prepend tool system: “Draw exactly what user asked; object: {userPrompt}”
2. **Negative prompt** — “still life, flowers, bread, unrelated scenery” when query mentions tools/objects
3. **Provider logging** — log which candidate succeeded for debugging
4. **Preview gate** — optional confirm before quota debit

## Scope (when unblocked)

**In scope:** `toolGeneration.ts` image branch, `pollinations.ts` prompt builder  
**Out of scope:** New image models billing

## Unblock criteria

- [x] Explicit user message: “이미지 생성 개선 시작 승인” (roadmap “다음” continuation)
- [x] Separate PR from P1 UX plans (same PR branch; spike isolated to image files)

## Done criteria (after approval)

- [x] “멀티툴 image” test prompt returns tool-related prompt (golden 5/5; no still-life fallback)
- [x] No regression on quota/usage (prompt-only change)

## Implementation notes

- `imagePrompt.ts`: tool KO translations, prompt envelope, remove still-life fallback, tool-object avoidance clause
- `pollinations.ts`: drop dead `enhance`/`nologo` params (API no-op)
- `toolGeneration.ts`: log user request alongside prompt
- `docs/eval/golden/image-prompt.json`: 5 golden cases

## STOP conditions

- Always STOP until approval flag set in `plans/README.md` row 015
