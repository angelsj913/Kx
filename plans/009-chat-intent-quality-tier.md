# Plan 009: Fix PPT meta-intent + quality presets + agent placeholders

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/lib/intentTools.ts src/lib/backendRoute.ts src/lib/tools.ts src/app/api/chat/route.ts`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: MED | **Planned at**: `9d8b25f`

## Why this matters

Question “ppt 생성은 무슨 ai로 하나요” triggers `detectQuickToolFromText` → `ppt` → empty deck error (`pptx.ts:324`). Agent placeholder still says “발표 자료 만들어줘” (`tools.ts:902`) for removed flow.

## Current state

**intentTools.ts:17-38** — `\b(ppt|pptx|powerpoint)\b` matches without meta-question guard.

**backendRoute.ts:151** — `detectQuickToolFromText(args.text)` always applied.

**tools.ts:902** — agent placeholder with deleted feature reference.

## Scope

**In scope:**
- `intentTools.ts` — exclude meta/informational questions
- `backendRoute.ts` + `chat/route.ts` — pass `qualityTier` from client
- New UI: Low / Medium / High in composer → maps to model + tokens + verify depth
- Replace agent placeholder in `tools.ts` + `toolPlaceholders.ts`
- Grep cleanup: `rg "발표 자료 만들|presentation material" src`

**Out of scope:**
- Changing PPT generation quality (plan 011)

## Steps

### Step 1: Meta-question guard

Add to `detectQuickToolFromText`:
```ts
const isInformational =
  /무슨\s*ai|어떤\s*ai|what\s+ai|which\s+model|어떻게\s*(작동|동작)|뭐로\s*(만들|생성)/i.test(t);
const wantsCreation = /(만들|생성|작성|해\s*줘|해줘|draft|create|make|generate)/i.test(t);
if (isInformational && !wantsCreation) return null;
```

Add unit test in `scripts/` or inline test file if pattern exists.

**Verify**: “ppt 생성은 무슨 ai로 하나요” → `null`

### Step 2: Quality tier

Define `QualityTier = "low" | "medium" | "high"` in `src/lib/qualityTier.ts`:
| Tier | model hint | maxTokens | verify |
|------|------------|-----------|--------|
| low | flash | 1024 | off |
| medium | default | 4096 | light |
| high | pro | 8192 | deep |

Wire from ChatWorkspace state → API body → `runBackendRoute`.

### Step 3: Placeholder fix

Replace `tools.ts:902` with e.g. “예) 서재 PDF 핵심만 요약해줘”

**Verify**: `npm run lint` && manual chat test for meta question

## Done criteria

- [ ] Meta PPT question returns conversational answer, no pptx error
- [ ] Quality selector visible in composer, persisted in localStorage
- [ ] No “발표 자료 만들어줘” in agent placeholder

## STOP conditions

- Quality tier breaks existing default behavior for all users — default `medium`

## Maintenance notes

Add eval case to `docs/eval/golden/chat.json` for meta-intent
