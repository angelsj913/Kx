# Landing Dense Enterprise Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Replace sticky landing scroll with dense static enterprise sections; tighten Hero.

**Architecture:** Keep section components and i18n keys; rewrite layouts inside `Hero`, `SkillsSection`, `FeatureShowcase`, `WorkLectureScroll`; tighten `WorkspaceIntro` / `PricingLead` / `Pricing`. Drop `useScrollProgress` sticky usage from homepage sections.

**Tech Stack:** Next.js App Router, Tailwind, framer-motion (light), landingI18n, existing landing CSS tokens.

## Global Constraints

- Preserve `--landing-*` tokens and blue accent
- Reuse existing i18n keys (ko source of truth); avoid new keys unless necessary
- No cards floating as hero overlays; product preview is part of the composition
- Homepage must not introduce new `/api/auth/session` dependency beyond what Header already does
- Prefer `/app` for start CTAs

---

### Task 1: Hero density

Rewrite `src/components/landing/Hero.tsx`:
- Reduce `pt-28/36` → tighter (`pt-24 sm:pt-28`)
- Remove trailing mid-page Logo block
- Add full-width product preview chrome under CTA (chat/workspace mock using CSS, not a detached card sticker)
- Keep video/poster full-bleed background + gradient
- Keep download modal path when env flag on

### Task 2: Skills static grid

Rewrite `SkillsSection.tsx` to remove sticky track:
- Header + 3-column dense cards (design / STEM / report) with compact SceneBackground accents
- CTA band with tighter `py`
- `appHref = "/app"`; drop `useSession`

### Task 3: Features static splits

Make `FeatureShowcase` always use strip + `StaticSceneBlock` layout (delete sticky path). Tighten vertical padding.

### Task 4: Office/Lecture grid

Rewrite `WorkLectureScroll` as static 3-column grid (PPT / Excel / Lecture) with mocks always visible at `progress={1}`. Keep `#office` / `#prototype` anchors.

### Task 5: Tighten Workspace + Pricing

Reduce `py-16/20` → `py-10/14`, Pricing `pb-28` → `pb-16`. Workspace CTA → `/app`, drop `useSession`.

### Task 6: Verify + PR

- Confirm no `h-[360vh]|320vh|420vh` on homepage components
- Commit, push, open PR
