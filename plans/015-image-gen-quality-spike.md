# Plan 015: Image generation quality spike (APPROVAL GATE)

> **Status**: **BLOCKED** — do not implement until product owner approves image-gen work.

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: MED | **Planned at**: `9d8b25f`

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

- [ ] Explicit user message: “이미지 생성 개선 시작 승인”
- [ ] Separate PR from P1 UX plans

## Done criteria (after approval)

- [ ] “멀ti-tool image” test prompt returns tool-related image ≥3/5 trials
- [ ] No regression on quota/usage

## STOP conditions

- Always STOP until approval flag set in `plans/README.md` row 015
