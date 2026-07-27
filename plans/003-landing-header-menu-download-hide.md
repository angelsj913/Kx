# Plan 003: Header/menu color sync + hide download UX (keep code)

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/components/landing/Header.tsx src/components/landing/Hero.tsx src/lib/landingI18n/`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW | **Planned at**: `9d8b25f`

## Why this matters

When the hamburger menu opens, the header background (`transparent` or `bg-white/70`) does not match the drawer (`bg-white/85`), causing a visible seam. Download CTAs should be hidden from UX while preserving download infrastructure for later.

## Current state

**Header** (`Header.tsx:76-80`): scrolled ? frosted : transparent — **does not consider `menuOpen`**

**Drawer** (`Header.tsx:166`): `bg-white/85 dark:bg-slate-950/85`

**Hero** (`Hero.tsx`): Windows/Mac/Android download buttons + modals

**Constants** (`src/lib/constants.ts`): `WINDOWS_DOWNLOAD_URL`, etc. — **keep**

## Scope

**In scope:**
- `Header.tsx` — when `menuOpen`, apply same surface classes as drawer to `<header>`
- `Hero.tsx` — wrap download CTA block with `process.env.NEXT_PUBLIC_SHOW_DOWNLOAD_CTA === "1"` (default hidden)
- Remove download **description copy** from hero i18n display when hidden (keys can remain)
- Optional: hide `/download` from `MENU_LINKS` when flag off

**Out of scope:**
- Deleting `DownloadCta.tsx`, `/download/page.tsx`, electron build scripts
- Changing `constants.ts` URLs

## Steps

### Step 1: Feature flag

Add to `.env.example` (if exists) or document in plan commit:
```
NEXT_PUBLIC_SHOW_DOWNLOAD_CTA=0
```

In `Hero.tsx`, guard download section:
```tsx
const showDownload = process.env.NEXT_PUBLIC_SHOW_DOWNLOAD_CTA === "1";
// ...
{showDownload && ( ... existing CTAs ... )}
```

Remove hero subtitle lines that mention Windows/Mac/Android when `!showDownload` (grep `hero.subtitle`, `hero.modal` in landing i18n usage).

### Step 2: Header/menu color sync

Extract shared class:
```tsx
const menuSurface =
  "border-slate-900/[0.06] bg-white/85 backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.08] dark:bg-slate-950/85";

className={cn(
  menuOpen ? menuSurface : scrolled ? menuSurface : "border-transparent bg-transparent"
)}
```

Apply to both `<header>` and drawer panel for identical tokens.

**Verify**: Open hamburger on hero — no color seam between header and drawer.

### Step 3: Lint + build smoke

**Verify**: `npm run lint` → exit 0

## Done criteria

- [ ] Hamburger open: header and drawer same background
- [ ] Hero shows no download buttons with default env
- [ ] `/download` page still loads when navigated directly
- [ ] Download-related source files still exist (`Hero` modal code, `constants.ts`)

## STOP conditions

- Removing any file under `src/lib/constants.ts` or electron scripts
