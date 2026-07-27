# Plan 004: Differentiate scroll demo sections + library promotion

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/components/landing/WorkLectureScroll.tsx src/components/landing/FeatureShowcase.tsx src/components/landing/FeatureGrid.tsx`

## Status

- **Priority**: P1 | **Effort**: L | **Risk**: MED | **Depends on**: 003 | **Planned at**: `9d8b25f`

## Why this matters

`WorkLectureScroll` (3 scenes) and `FeatureShowcase` (4 scenes) both use sticky scroll + horizontal track from `landingScroll.ts`, producing visually similar “throttle” experiences. User wants each scene visually distinct and library feature promoted on homepage.

## Current state

- `WorkLectureScroll.tsx` — MockPptSlides, MockExcelGrid, lecture mock — shared card chrome
- `FeatureShowcase.tsx` — 4 items in COPY (AI summary, lecture, docs, shared library)
- `FeatureGrid.tsx` — 6 static cards; some copy duplicates showcase themes
- Shared utilities: `src/lib/landingScroll.ts`

## Executor toolkit

- Read `.agents/skills/nothing-design/SKILL.md` — monochromatic, typography-driven, no gradients in chrome
- Read `.agents/skills/frontend-design/SKILL.md` — avoid template hero patterns

## Scope

**In scope:**
- Redesign each scene mock with **different layout archetype** (see README F-12)
- Add dedicated **Library / Book Chat** scroll or grid slot; remove redundant duplicate copy elsewhere
- `landingI18n/*.ts` — new keys for library promo only where needed

**Out of scope:**
- Full nothing-design token pass (plan 005)
- Removing scroll interaction entirely

## Steps

### Step 1: Scene differentiation matrix

Implement per-scene unique mock components:

| Section | Scene | Visual form |
|---------|-------|-------------|
| WorkLectureScroll | PPT | Dot-matrix title + 3 thumb grid |
| | Excel | Mono table + inline bar sparkline |
| | Lecture | Timestamped transcript column |
| FeatureShowcase | Summary | PDF stack + 3 bullets |
| | Lecture | Waveform + single note block |
| | Docs | Tab bar docx/pptx/xlsx |
| | Library | Shelf icons + “Book Chat” bubble |

### Step 2: Remove duplicate explanations

Grep landing copy for repeated “로컬 히스토리”, duplicate library lines between `FeatureGrid` and `FeatureShowcase`. Keep **one** library story in showcase; trim grid card if redundant.

### Step 3: Reduced motion

Preserve `prefers-reduced-motion` static fallbacks in both components.

**Verify**: `npm run lint` → exit 0

## Done criteria

- [ ] 7 scene mocks use at least 4 distinct layout patterns (visual review)
- [ ] Library promoted in one primary homepage section
- [ ] No duplicate library paragraph in two adjacent sections

## STOP conditions

- Scene redesign breaks mobile layout — fix before marking done
