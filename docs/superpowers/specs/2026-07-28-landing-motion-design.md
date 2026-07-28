# Landing Motion — Design Spec (2026-07-28)

Companion to [`DESIGN.md`](../../DESIGN.md) and [`PRD_LANDING_MOTION_2026-07.md`](../PRD_LANDING_MOTION_2026-07.md).

## Context weighting (design-motion-principles)

| Designer | Weight | Application |
|----------|--------|-------------|
| Jakub Krehel | Primary | Scroll transitions, card polish, production timing |
| Jhey Tompkins | Secondary | Radial accents, sticky track motion |
| Emil Kowalski | Selective | Header/nav — no animation on language menu open beyond 200ms |

## Unified surface

**Before:** `SkillsSection` scenes used `bg-gradient-to-br from-slate-50…`; band blocks used `--landing-bg-soft`.

**After:**

```css
.landing-shell { background: var(--landing-bg); }
.landing-shell::before { /* glow only, fixed */ }
.landing-scene-accent { /* radial at 10% opacity, no fill */ }
.landing-section-rule { border-top: 1px solid var(--landing-border); }
```

Scene panels: `background: transparent`; content in `.landing-card` where needed.

## Scroll section heights

| Section | Scroll height | Scenes |
|---------|---------------|--------|
| SkillsSection | 360vh | 3 |
| FeatureShowcase | 320vh | 2 |
| WorkLectureScroll | 300vh | 3 |

Minimum sticky inner padding: `py-12 sm:py-16` so copy + mock never float in empty center.

## WorkspaceIntro density

Replace single-column CTA-only block with:

- Eyebrow + H2 + subtitle (existing)
- 3-column grid: Chat / Documents / Library (icons from lucide)
- Full-width CTA below grid

## Motion tokens (globals)

```css
--ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
--landing-enter-duration: 280ms;
```

Framer: `transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}`

## Trust & guardrails

- No new pricing claims beyond 6-month table in DESIGN.md
- Download CTA gated by `NEXT_PUBLIC_SHOW_DOWNLOAD_CTA`
- Payments gated by `NEXT_PUBLIC_PAYMENTS_ENABLED`
