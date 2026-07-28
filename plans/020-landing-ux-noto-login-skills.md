# Plan 020: Landing UX — Noto/white/blue CTA, login loop, quality in +, 3-skill marketing

> **Executor instructions**: Follow step by step. Run every verification before the next step. On STOP conditions, stop and report — do not improvise. When done, mark this plan DONE in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a78c6d6..HEAD -- src/app/globals.css src/app/layout.tsx src/components/landing src/app/login src/components/ChatWorkspace.tsx src/proxy.ts`

## Status

- **Priority**: P1 | **Effort**: L | **Risk**: MED | **Depends on**: none (visually supersedes 005) | **Category**: direction | **Planned at**: `a78c6d6` | **Status**: TODO

## Why this matters

New product PRD ([`docs/PRD_PRODUCT_RAG_UPGRADE_2026-07.md`](../docs/PRD_PRODUCT_RAG_UPGRADE_2026-07.md)) reverses nothing-design cream/red/Doto toward a calm professional shell, fixes the logged-in CTA login loop, simplifies login/chat chrome, and compresses landing marketing to three differentiated skills.

## Defaults

- Design: **Noto Sans KR**, white/light gray background, CTA **`#2563EB`**, remove `01` labels
- `/design` · Higgsfield: **marketing only** (card + optional placeholder page; no API)
- Chat quality tier moves into **`+` menu** (keep same `qualityTier` state/API)

## Current state (evidence)

| Area | File | Issue |
|------|------|-------|
| Fonts | `layout.tsx` loads Space Grotesk/Doto; `.landing-shell` uses them | Not Noto-first |
| BG | `globals.css` `.landing-shell` `#f5f3ee` | Cream / yellow-leaning |
| Hero CTA | `Hero.tsx` → `/login`, `--landing-accent` red | Loop + wrong color |
| `01` | `Hero.tsx` Doto badge; `FeatureShowcase` scene numbers | Digital chrome |
| Login | `login/page.tsx` hardcodes `callbackUrl` to `/` on web | Ignores `?callbackUrl=` |
| Quality | `ChatWorkspace.tsx` ~segmented control above composer | Crowds input bar |
| Marketing | `WorkLectureScroll`, long showcase | Not 3-skill slim |

## Scope

**In scope:**
1. Landing (+ shared body where trivial) font → Noto Sans KR; shell → white / light gray; accent → `#2563EB`
2. Remove hero/showcase `01`-style digital labels
3. Session-aware Hero CTA (`/app` if logged in, else `/login`); Header: no duplicate startWeb next to Login when logged out; logged-in Header keeps single entry to `/app`
4. Login: honor `callbackUrl` (default `/app`); if session exists redirect to `/app` (or callback); simplify visual chrome (Logo component, fewer competing CTAs); keep Google + email + 2FA functional — do not remove auth methods
5. Move 빠름/보통/정밀 into `+` quick-actions menu; remove standalone row above composer
6. Rebuild landing mid-page to **two short skill sections** featuring: 콘텐츠 자동화(`/design` marketing), STEM 분석, 지능형 리포트 — trim long lecture/office prose
7. Optional thin `/design` page: “준비 중” / waitlist copy linking back home (no Higgsfield SDK)

**Out of scope:**
- Higgsfield API / carousel generation
- RAG engine changes (plan 021)
- Full rewrite of Pricing or company pages

## Steps

### Step 1: Tokens & fonts

- Update `--landing-*` in `globals.css`: background white / `#F8FAFC`, text charcoal, accent `#2563EB`
- Prefer `--font-noto-sans-kr` on `.landing-shell` and `body` (or document if app-wide Noto is too broad — **prefer app-wide Noto for PRD “전체 서비스”**)
- Deprecate Doto / Space Grotesk usage on landing labels/display (may leave font loaded unused for one PR if tree-shake hard)

**Verify**: Landing screenshot or CSS grep — no `#f5f3ee`, no `landing-display` Doto on hero.

### Step 2: Hero + Header CTAs + login loop

- `Hero.tsx`: `useSession`; CTA href = session ? `/app` : `/login?callbackUrl=/app`; button `bg-[#2563EB]` or CSS var
- Remove `01` badge block
- `login/page.tsx`: read `searchParams.callbackUrl` (safe same-origin path only); default `/app`; `useSession` → redirect when authenticated
- Ensure `proxy`/middleware still protects `/app`

**Verify**: Manual checklist — logged-in user clicks 웹에서 시작하기 → `/app` without seeing login form.

### Step 3: Chat quality into `+`

- Relocate quality tier control into `quickActionsOpen` panel in `ChatWorkspace.tsx`
- Keep `localStorage` + form `qualityTier` behavior

**Verify**: Composer has no standalone 빠름/보통/정밀 row; `+` opens tools + quality.

### Step 4: Marketing slim + `/design` placeholder

- Replace or heavily trim `WorkLectureScroll` / mid sections with a **Skills** block (3 cards) using i18n keys
- STEM → deep-link workspace tool hints; Report → library/report tools; Design → `/design`
- Add `src/app/design/page.tsx` placeholder (auth optional; marketing OK public)

**Verify**: Landing mid-scroll shows three skills; `/design` renders without 500.

### Step 5: Regression

```bash
npm run lint
npx tsc --noEmit
```

## Done criteria

- [ ] Landing: Noto-first, white/light shell, blue CTA, no `01` chrome
- [ ] Logged-in startWeb → `/app`; login respects `callbackUrl`
- [ ] Quality tier only inside `+` menu
- [ ] Three skill cards + `/design` placeholder
- [ ] lint / tsc pass

## STOP conditions

- Auth/session APIs differ from `next-auth` patterns assumed — stop and report before inventing auth
- Removing 2FA or Google login to “simplify” — **forbidden**; simplify layout only
