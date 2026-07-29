# Performance Wave B P0 — Implementation Plan

> For agentic workers. Spec: `docs/PRD_SCAN_LICENSE_PERF_2026-07.md` §5 Wave B (P0 only).

**Goal:** Cut landing font waterfall and `/app` auth/DB duplication without changing product UX.

**Architecture:** Keep Auth.js + Prisma; reduce *where* they run. Marketing routes no longer go through `auth()` proxy. Root layout ships only fonts that CSS actually uses. App layout performs a single session+password gate instead of triple `auth()`.

**Tech stack:** Next.js 16 (proxy), NextAuth v5, Prisma + Supabase pooler.

---

### Task 1: Trim unused Google fonts

**Files:**
- Modify: `src/app/layout.tsx`
- Check: `src/app/globals.css` (confirm which `--font-*` vars are used)

**Steps:**
1. Grep for `--font-space-grotesk`, `--font-space-mono`, `--font-doto` usage outside layout.
2. If unused, remove `Space_Grotesk`, `Space_Mono`, `Doto` imports and `className` vars from `<html>`.
3. Keep `Geist`, `Geist_Mono`, `Noto_Sans_KR`. Prefer fewer Noto weights if safe (`400`,`500`,`700` or `400`,`700`).
4. Set `preload: false` on mono; keep one KR weight preload if needed.
5. Build smoke: `SKIP_DB_PUSH=1 DATABASE_URL=… npm run build` (or typecheck).

**Done when:** Root layout loads ≤3 font families; unused vars gone.

---

### Task 2: Narrow proxy auth to `/app`

**Files:**
- Modify: `src/proxy.ts`
- Modify: `next.config.ts` (move CSP/HSTS/geo for public routes if needed)

**Steps:**
1. Change `config.matcher` so `auth()` wrapper only runs on `/app` paths (and optionally `/admin` if currently protected only by page-level `requireAdmin`).
2. Keep CSP/security headers for all HTML: either keep a thin non-auth proxy for all pages, or set equivalent headers in `next.config.ts`.
3. Prefer: split — `auth` only for `/app/:path*`; public pages get headers via `next.config` **or** a second lightweight export if Next 16 allows one proxy only.

**Constraint:** Next may allow only one `proxy` export. If so, structure as:
```ts
export const proxy = (req) => {
  // always set security headers + geo cookie
  // only call auth()/redirect when pathname.startsWith("/app")
};
```
Do **not** wrap entire tree in `auth()` if that forces JWT work on `/`.

**Done when:** Visiting `/` does not require Auth.js session resolution at proxy layer (or cost is negligible cookie-only); `/app` still redirects unauthenticated users to login.

---

### Task 3: Single auth pass in `/app` layout

**Files:**
- Modify: `src/app/app/layout.tsx`
- Modify: `src/lib/authComplete.ts` (accept optional session to avoid second `auth()`)

**Steps:**
1. `const session = await auth()` once in layout.
2. Pass session into `requirePasswordComplete(session)` so it does not call `auth()` again.
3. Leave JWT `sessionVersion` interval for a later P1 PR (optional small bump 5s→60s if trivial).

**Done when:** Password gate still redirects Google users without password; only one `auth()` in app layout code path.

---

### Task 4: Verify + PR

1. Build succeeds.
2. Commit/push `cursor/perf-wave-b-p0-a14a`.
3. Open draft PR against `main`.
