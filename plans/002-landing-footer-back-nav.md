# Plan 002: Footer layout + landing back navigation → home hero

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/components/landing/Footer.tsx src/components/ui/BackButton.tsx src/components/landing/CompanyPageContent.tsx src/app/download/`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Planned at**: `9d8b25f`

## Why this matters

Users expect “뒤로가기” from company subpages to return to the homepage hero, not the previous menu tab in history. Footer legal links should sit above representative contact info on the right, per product brief.

## Current state

**Footer** (`src/components/landing/Footer.tsx:31-47`):
```tsx
<nav className="... justify-center ...">  // links LEFT on md
<p className="... md:text-right">         // contact RIGHT
```

**BackButton** (`src/components/ui/BackButton.tsx:28-37`):
```tsx
if (typeof window !== "undefined" && window.history.length > 1) {
  router.back();  // goes to previous history entry
}
```

**CompanyPageContent** (`src/components/landing/CompanyPageContent.tsx`) — uses `<BackButton fallbackHref="/" />` without `forceFallback`.

**SupportShell** already uses `forceFallback` — keep that pattern.

## Scope

**In scope:**
- `Footer.tsx` — move nav to right column above contact paragraph
- `BackButton.tsx` — add prop `landingMode?: boolean` OR update all landing subpage callers to `forceFallback={true} fallbackHref="/"`
- Callers: `CompanyPageContent.tsx`, `src/app/download/page.tsx`, any landing subpage using BackButton

**Out of scope:**
- `/app` workspace back navigation
- Hamburger drawer (no back button needed)

## Steps

### Step 1: Footer layout

Restructure footer to:
```tsx
<div className="relative z-10 flex flex-col items-center md:items-end md:text-right">
  <nav>...</nav>
  <p className="mt-3">ZEFF AI · contact · CEO</p>
</div>
```

Remove left-side nav on md; center on mobile if needed.

**Verify**: Visual — links appear above contact on desktop.

### Step 2: Force back to home on landing subpages

For every landing subpage BackButton, set:
```tsx
<BackButton fallbackHref="/" forceFallback />
```

Files to grep: `BackButton` imports under `src/app/` and `src/components/landing/`.

**Verify**: `rg "BackButton" src --glob "*.tsx"` — all landing uses have `forceFallback`

### Step 3: Lint

**Verify**: `npm run lint` → exit 0

## Done criteria

- [x] Footer links right-aligned above contact block
- [x] `/about` → Back → `/` (not `/vision` from tab history)
- [x] `npm run lint` exit 0

## STOP conditions

- BackButton used in `/login` with intentional history-back — do not change auth flows without checking `src/app/login/page.tsx`
