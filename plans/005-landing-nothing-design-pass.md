# Plan 005: Nothing-design token pass on landing

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/components/landing/ src/app/page.tsx src/app/globals.css`

## Status

- **Priority**: P2 | **Effort**: L | **Risk**: MED | **Depends on**: 004 | **Planned at**: `9d8b25f`

## Why this matters

User requested `/nothing-design` for homepage redesign — monochromatic, typographic, industrial warmth. Current landing uses blue gradients and generic SaaS patterns.

## Executor toolkit

**Required reads before coding:**
- `.agents/skills/nothing-design/SKILL.md`
- `.agents/skills/nothing-design/references/tokens.md`
- `.agents/skills/nothing-design/references/components.md`

**Fonts (declare in layout or globals):**
```
Space Grotesk, Space Mono, Doto — Google Fonts
```

## Scope

**In scope:**
- CSS variables on `.landing-shell` for light/dark nothing tokens
- Hero: one primary metric/display moment (Doto or Space Mono), remove gradient CTA in favor of single accent
- Header/footer typography: Space Mono labels
- Keep existing i18n structure

**Out of scope:**
- `/app` workspace theming
- Removing all blue — accent red `#D71921` for one CTA only per nothing-design rules

## Steps

### Step 1: Token layer

Add to `globals.css` or landing-scoped CSS:
```css
.landing-shell {
  --landing-bg: #F5F3EE;
  --landing-text-primary: rgba(26,26,26,0.9);
  --landing-accent: #D71921;
  /* dark mode overrides */
}
```

### Step 2: Hero refactor

Replace gradient blob + sparkle badge with nothing-style hierarchy (3-layer rule from skill).

### Step 3: Verify both themes

Toggle `ThemeToggle` — light and dark both first-class.

**Verify**: `npm run lint` && manual screenshot light/dark

## Done criteria

- [ ] Google Fonts loaded for Space Grotesk, Space Mono, Doto
- [ ] Hero has exactly one red accent element
- [ ] No gradient on UI chrome (hero background glow OK if subtle)

## STOP conditions

- Breaking `LandingViewportScale` mobile rem scaling — test mobile width 375px
