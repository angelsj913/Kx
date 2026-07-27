# Plan 006: Humanize landing + workspace copy

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/lib/landingI18n/ src/lib/i18n.ts`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW | **Depends on**: none | **Planned at**: `9d8b25f`

## Why this matters

Homepage, workspace, and company pages read AI-generated. User wants `/humanizer`-style natural Korean (and other locales where present).

## Current state

**Company pages** (`landingI18n/ko.ts:326-346`): long formal paragraphs with “저희는 ~지향합니다” patterns.

**Workspace** (`i18n.ts`): `chat.empty`, `chat.emptyHint`, status strings — some robotic.

**Note:** No `humanizer` skill in repo. Use **copy-editing principles**:
- Vary sentence length
- Remove clichés (“혁신적인”, “원활한”, “함께 만들어갑니다”)
- Active voice, concrete verbs
- Keep factual claims (features that exist in code)

## Scope

**In scope:**
- `company.about.*`, `company.vision.*`, `company.prototype.*` — all 8 locales in `landingI18n/`
- `FeatureShowcase` COPY in `FeatureShowcase.tsx` (ko/en minimum)
- Selected `i18n.ts` workspace strings: empty state, panel hints

**Out of scope:**
- Legal body text (plan 013)
- Rewriting entire i18n (3000+ keys)

## Steps

### Step 1: Korean company pages

Rewrite `ko.ts` company bodies — preserve Zeff chemistry metaphor and roadmap facts, shorten sentences.

### Step 2: EN/JA/other locales

Match tone in `en.ts`, `ja.ts` for same keys (do not leave ko-only drift).

### Step 3: Workspace hints

Humanize `chat.emptyHint`, `panel.emptyHint.*` — shorter, conversational.

**Verify**: `npm run lint` → exit 0

## Done criteria

- [ ] No “~지향합니다” more than once across company.about+vision
- [ ] Prototype bullets state “experimental” clearly
- [ ] Grep: `rg "함께 만들어|혁신적인|원활한" src/lib/landingI18n` → reduced or zero

## STOP conditions

- Changing meaning of features that do not exist — cross-check `PROGRESS.md`
