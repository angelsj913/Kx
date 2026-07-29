# Performance Wave B P2 — Implementation Plan

> Spec: `docs/PRD_SCAN_LICENSE_PERF_2026-07.md` §5 Wave B P2

**Goal:** Stop `/api/auth/session` on anonymous marketing traffic; cut landing scroll jank.

### Tasks

1. Remove `RootSessionProvider` from root layout; add `login`/`signup`/`support` layouts with SessionProvider.
2. Landing Header/Hero/Skills/WorkspaceIntro: no `useSession` — CTAs use `/app` (proxy redirects guests); optional session-cookie bit for header login/logout UI.
3. Landing below-fold sections: `dynamic(..., { ssr: false })`.
4. Shared window scroll bus in `landingScroll.ts` so multiple sticky sections share one listener.

### Verify

- Anonymous `/` does not call `/api/auth/session` (Network tab).
- `/app` still protected; `/login` still works with useSession.
- Sticky sections still animate; reduced-motion path unchanged.
