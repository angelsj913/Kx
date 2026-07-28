# ZEFF AI — Design System (Landing + Marketing)

> Single source for tokens, motion, and layout rules. Agents and `/improve` read this before changing `src/components/landing/` or `globals.css`.

## Brand intent

- **Product**: AI workspace for documents, lectures, PPT/Excel, and team library.
- **Tone**: Calm, capable, trustworthy — not playful SaaS template, not sterile enterprise.
- **Motion stance** (from `design-motion-principles` + `animate`): Marketing/landing = **Jakub (polish) + Jhey (scroll delight)**, Emil restraint on nav/forms. Duration 200–400ms, `ease-out` enter, `prefers-reduced-motion` always respected.

## Color — one surface

All landing sections share **one page background**. Section “bands” must not introduce a second fill (`bg-slate-50`, `landing-bg-soft`, etc.).

| Token | Light | Dark | Usage |
|-------|-------|------|--------|
| `--landing-bg` | `#ffffff` | `#0a1120` | **Only** page fill |
| `--landing-text-primary` | `#0f172a` | `rgba(248,250,252,0.94)` | Headlines, body |
| `--landing-text-muted` | `#64748b` | `rgba(148,163,184,0.85)` | Labels, secondary |
| `--landing-accent` | `#2563eb` | `#3b82f6` | Primary CTA, active scroll dot |
| `--landing-accent-muted` | `rgba(37,99,235,0.10)` | `rgba(59,130,246,0.14)` | Badges, radial accents |
| `--landing-border` | `rgba(226,232,240,0.8)` | `rgba(51,65,85,0.6)` | Cards, dividers |

**Atmosphere** (optional, never a second bg):

- Fixed `::before` on `.landing-shell`: subtle top glow `--landing-glow` only.
- In-scroll accents: `radial-gradient` at 8–14% opacity, **no opaque gradients** on scene panels.

## Typography

- **Family**: Noto Sans KR + Geist (`--font-noto-kr`, `--font-geist-sans`).
- **`.landing-label`**: 12px, letter-spacing 0.06em, muted color — section eyebrows.
- **`.landing-display`**: Section H2 — bold, tight tracking.
- **Scale**: Hero H1 3xl→5xl; section H2 2xl→3xl; body sm→base.

## Layout

- **Max width**: `max-w-6xl` (sections), `max-w-5xl` (narrow narrative).
- **Section padding**: `py-16 sm:py-20` minimum; scroll scenes `min-h-[100svh]` sticky.
- **Scroll IA** (home): Hero → Skills (3 scenes) → Features (2 scenes) → Work/Lecture (3 scenes) → Workspace CTA → Pricing lead → Pricing → Footer.
- **Density**: No empty “spacer” sections; every block has eyebrow + headline + body + visual or CTA.

## Components

| Pattern | Class / component | Notes |
|---------|-------------------|--------|
| Card on unified bg | `.landing-card` | Frosted white/slate-900, blur 8px |
| Primary CTA | `rounded-full bg-[var(--landing-accent)]` | One accent per viewport |
| Section divider | `.landing-section-rule` | 1px border only, no bg change |
| Scroll progress | `useScrollProgress` + sticky | 320–360vh per multi-scene block |
| Reduced motion | `useReducedMotion` / `reducedMotion` branch | Static stacked layout, same copy |

## Motion recipes

```css
--ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
--landing-enter-duration: 280ms;
```

- **Hero**: `.hero-fade-up` stagger (existing), max 3 delays.
- **Scroll scene change**: opacity + 8px Y, 280ms ease-out.
- **Cards**: hover `translateY(-2px)` + shadow, 200ms — not scale on large panels.
- **Never**: bounce, 800ms+ transitions, parallax on mobile, animating width/height.

## Pricing copy (6-month billing)

| Plan | Price | Period |
|------|-------|--------|
| Pro | $35 | / 6 months |
| Professional | $50 | / 6 months |

Display in landing i18n + `src/lib/plans.ts` — keep in sync.

## Guardrails (`guardrail-design`, `trust-calibration`)

- No fake metrics, “#1 AI”, or stock-photo people on landing.
- CTAs honest: “곧 오픈” when `NEXT_PUBLIC_PAYMENTS_ENABLED !== "1"`.
- Motion never blocks reading or WCAG focus order.

## Files

| Area | Path |
|------|------|
| Tokens + shell | `src/app/globals.css` (`.landing-shell`) |
| Motion hook | `src/lib/useReducedMotion.ts`, `src/lib/landingScroll.ts` |
| Sections | `src/components/landing/*` |
| Copy | `src/lib/landingI18n/*.ts` |
