# Plan 007: Restore admin panel discoverability

> **Drift check**: `git diff --stat 9d8b25f..HEAD -- src/components/landing/Header.tsx src/lib/admin.ts src/components/AdminDeniedBanner.tsx`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Planned at**: `9d8b25f`

## Why this matters

Admin routes exist (`/admin`, `src/app/admin/`) but UX hides entry: wrench icon desktop-only, not in hamburger, `AdminDeniedBanner` never shows (`requireAdminPage` redirects to `/` without query).

## Current state

```tsx
// Header.tsx:46
const isAdmin = isLoggedIn && session?.user?.isAdmin === true;

// admin.ts:28 — server also checks email allowlist
export function isAdminSession(session) {
  if (session.user.isAdmin === true) return true;
  return isAdminEmail(session.user.email);
}
```

Session should set `isAdmin` via `auth.ts:150` — if JWT stale, email check still works server-side but **client header won't show link**.

## Scope

**In scope:**
- Add admin link to hamburger `MENU_LINKS` when `isAdmin` (or `isAdminEmail(session.user.email)` client-side helper)
- `requireAdminPage`: redirect to `/?admin=denied` instead of `/`
- `AdminDeniedBanner.tsx` — verify displays on denied
- Document `ADMIN_EMAILS` in README or `docs/` one line

**Out of scope:**
- MFA flow changes (`/admin/verify`)
- Non-admin users seeing admin link

## Steps

### Step 1: Hamburger admin entry

When `isAdmin`, append to nav:
```tsx
{isAdmin && (
  <a href="/admin" className="...">
    <Wrench /> {t("header.admin")}
  </a>
)}
```

Use `<a href>` not `<Link>` (existing pattern for admin).

### Step 2: Denied redirect

In `src/lib/requireAdmin.ts`, change redirect to `/?admin=denied`.

### Step 3: Verify banner

`AdminDeniedBanner.tsx` reads `admin=denied` query — test manually.

**Verify**: `npm run lint` → exit 0

## Done criteria

- [ ] Admin user sees link in hamburger on mobile width
- [ ] Non-admin hitting `/admin` sees denied banner on home
- [ ] `ADMIN_EMAILS` documented

## STOP conditions

- Exposing admin link to non-admin sessions
