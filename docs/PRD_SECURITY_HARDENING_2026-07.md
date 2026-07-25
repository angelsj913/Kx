# PRD: Kx (ZEFF AI) Security Hardening

| Field | Value |
|-------|--------|
| **Product / Feature** | Security Hardening — Auth, OTP, Sessions, Dependencies, Abuse Surfaces |
| **Status** | Approved — implemented 2026-07-24 |
| **Author** | Security audit follow-up (Cursor agent) |
| **Stakeholders** | Product owner, engineering |
| **Date Created** | 2026-07-24 |
| **Version** | 1.0 |
| **Related audit** | Anthropic Cybersecurity Skills pack review (Phase 2 findings) |

---

## 1. Executive Summary

**One-liner:** Close high-impact auth/session and dependency gaps so password resets, OTP, admin actions, and framework stacks behave like production security baselines.

**Overview:**  
A defensive security review of the Kx (ZEFF AI) Next.js app found concrete issues: password reset does not invalidate JWT sessions; OTP uses non-cryptographic RNG and can leak codes in admin JSON responses; admin emails are hardcoded; unauthenticated public blob uploads exist on support inquiries; CSP is loose; cron secrets may appear in query strings; JWT revocation has a delayed/fail-open window; and `npm audit` reports Critical/High issues in Auth.js and Next.js.

This PRD defines **what we will change**, **in what order**, **acceptance criteria**, and **what we will not do** (no offensive testing, no broad refactors). Implementation starts only after explicit approval of this document (and of each release phase if preferred).

**Quick Facts:**
- **Target users:** All end users (session integrity), admins (OTP/plan changes), operators (cron/RAG secrets)
- **Problem solved:** Stolen sessions surviving password reset; weak OTP entropy; secret leakage paths; known CVEs in auth stack
- **Key metric:** Zero Critical/High findings from the agreed checklist remaining open after Phase C
- **Target:** Phased — P0 same sprint, P1 next, P2 hardening backlog

---

## 2. Problem Statement

### The Problem
Account security controls (password reset, OTP, admin 2-step, session revocation) do not fully match user and operator expectations. Dependency CVEs sit under the auth and framework layer. Secondary surfaces (public uploads, CSP, query secrets) increase blast radius if another bug appears.

### Current State
- Reset password updates `passwordHash` only; `sessionVersion` unchanged.
- OTP via `Math.random()`; admin-plan OTP may return `devCode` in production when mail fails.
- Admins include hardcoded emails in `src/lib/admin.ts`.
- Support inquiry allows guest upload to public Blob.
- CSP allows `'unsafe-inline'` / `'unsafe-eval'` for scripts.
- Cron auth accepts `?secret=`.
- JWT `sessionVersion` rechecked at most every 60s; DB errors fail-open.
- `npm audit`: Critical on `@auth/core` / `next-auth`; High on `next` and related.

### Impact
- **User:** Compromised session can outlive password reset; OTP theoretically weaker; support upload abuse can tarnish domain trust.
- **Business:** Payment/plan integrity and admin actions depend on OTP/session trust; CVEs create compliance and incident risk.
- **Why now:** Findings are identified, reproducible in code review, and mostly small targeted fixes — cheaper before growth/scale.

---

## 3. Goals & Objectives

### Goals
1. Password reset (and ideally password change after compromise) **invalidates other sessions**.
2. OTP generation and delivery meet **crypto + channel** standards (no production inline codes except explicit, logged break-glass).
3. Reduce **secret and privilege leakage** (admins via env only; cron secret not in URLs).
4. Patch or upgrade **Critical/High auth and Next dependencies** with a verified build.
5. Shrink abuse surface on **unauthenticated uploads** and document CSP follow-up.

### Non-goals
- Full CSP nonce migration in this PRD (tracked as Phase D optional).
- Penetration test / exploit PoCs against production.
- Rewriting NextAuth to another auth system.
- Fixing every Low finding in one release.

---

## 4. Personas

| Persona | Need |
|---------|------|
| **End user** | After “forgot password”, old stolen browsers/sessions stop working. |
| **User with 2FA** | Login codes are unpredictable and only arrive by email. |
| **Admin** | Plan changes require real email OTP; codes never appear in API JSON in production. |
| **Operator** | Cron/RAG jobs authenticate via Bearer only; secrets not in access logs via query. |

---

## 5. Requirements & User Stories

### P0 — Must ship first (session + OTP crypto + deps Critical)

#### US-01: Reset password kills other sessions
**As an** end user,  
**I want** all existing sessions invalidated when I reset my password,  
**So that** a thief with an old cookie cannot keep using my account.

**Acceptance criteria:**
- [ ] `POST /api/auth/reset-password` success path increments `user.sessionVersion` by 1 in the same transaction (or immediately after hash update).
- [ ] Existing JWT with previous `sv` fails `auth()` within one request after next node-side check (document 60s cache behavior; see US-07).
- [ ] Response UX unchanged: `{ ok: true }` on success; no new PII in errors.
- [ ] Automated or manual test: user A resets password; second browser still holding old cookie cannot call an authenticated API after version bump takes effect.

#### US-02: Cryptographic OTP
**As a** security-conscious product,  
**I want** OTP codes generated with CSPRNG,  
**So that** codes are not guessable via weak PRNG.

**Acceptance criteria:**
- [ ] `generateCode()` uses `crypto.randomInt` (or equivalent) for six digits `100000–999999`.
- [ ] No use of `Math.random()` for security-sensitive codes.
- [ ] Existing rate limits and TTL (3 min) unchanged unless separately approved.

#### US-03: Patch Auth.js / next-auth Critical
**As an** operator,  
**I want** Auth.js advisories addressed,  
**So that** login/OAuth are not running known Critical CVEs.

**Acceptance criteria:**
- [ ] Upgrade `next-auth` / `@auth/prisma-adapter` / `@auth/core` to versions that clear the Critical advisories reported by `npm audit` (or document residual risk if blocked).
- [ ] Smoke: email/password login, Google login (if configured), session cookie still works in local or preview.
- [ ] `npm audit` Critical count for `@auth/core` is 0 (or waived in writing).

---

### P1 — High priority (admin OTP, Next upgrade, uploads, cron URL)

#### US-04: No production admin OTP in JSON
**As an** admin,  
**I want** plan-change OTP only via email in production,  
**So that** XSS or response logging cannot steal the second factor.

**Acceptance criteria:**
- [ ] In `NODE_ENV === "production"`, `issueOtp(..., "admin-plan-change")` never returns `devCode` unless an explicit break-glass env (e.g. `ADMIN_OTP_INLINE=1`) is set **and** the event is logged.
- [ ] Default production: mail failure → `502` with clear ops message, no code in body.
- [ ] Non-production may still show `devCode` for local DX.

#### US-05: Next.js High CVE remediation
**As an** operator,  
**I want** Next patched within the 16.x line (or approved major),  
**So that** known SSRF/DoS/cache advisories are reduced.

**Acceptance criteria:**
- [ ] Upgrade `next` to the audit-recommended safe patch (e.g. ≥ 16.2.11) after CI/build green.
- [ ] App boots; checkout complete, auth, and one chat path smoke-tested.
- [ ] Document any remaining High vulns that require `--force` or major bumps (sharp/postcss) as follow-ups.

#### US-06: Support inquiry upload hardening
**As an** operator,  
**I want** guest inquiry attachments not to be a public malware host,  
**So that** our Blob/CDN is not abused.

**Acceptance criteria (choose one approach in implementation notes; default A):**
- **A (default):** Guests may file text-only inquiries; **attachments require login**. Logged-in uploads use private Blob (or signed URL) + MIME allowlist + size cap (keep 12MB or lower).
- **B:** Guests allowed attachments but private storage + virus/MIME checks + strict rate limit per IP.
- [ ] No `access: "public"` for untrusted user content without a documented exception.
- [ ] Rate limit on `POST /api/support/inquiry` (IP + optional email).

#### US-07: Cron/RAG secret not in query string
**As an** operator,  
**I want** secrets only in `Authorization: Bearer` (or dedicated header),  
**So that** access logs / Referer do not store the secret.

**Acceptance criteria:**
- [ ] `verifyCronSecret` rejects query `secret` in production (or entirely).
- [ ] Docs/scripts updated to Bearer-only.
- [ ] Existing Vercel Cron (Bearer auto-inject) still works.

---

### P2 — Hardening (admins env-only, session check, Low items)

#### US-08: Admin allowlist from env only
**As an** operator,  
**I want** admin emails configured via `ADMIN_EMAILS` (and optionally a secure store),  
**So that** git history does not permanently publish admin identities.

**Acceptance criteria:**
- [ ] Remove hardcoded `DEFAULT_ADMINS` from source (or empty array with comment that prod must set env).
- [ ] Production boot warning or fail-fast if `ADMIN_EMAILS` empty (product decision: warn vs hard fail — default **warn in preview, fail in production**).
- [ ] Migration note: set `ADMIN_EMAILS` on Vercel before deploy.

#### US-09: Tighter session revocation window
**As a** user who clicked “log out everywhere”,  
**I want** old JWTs to die as soon as practical,  
**So that** the 60s window is reduced without melting the DB.

**Acceptance criteria:**
- [ ] Reduce `svAt` recheck interval from 60s to ≤ 15s **or** force recheck on sensitive routes (password change, billing, admin).
- [ ] Document fail-open on DB error; optional: fail-closed for admin routes only.
- [ ] No mass logout storms under normal load (monitor Prisma rate).

#### US-10: Low-hanging crypto hygiene
**As a** platform,  
**I want** constant-time OTP compare and stronger bcrypt cost,  
**So that** we match common baselines.

**Acceptance criteria:**
- [ ] OTP compare via `timingSafeEqual` on normalized buffers (same length pad strategy documented).
- [ ] bcrypt cost factor 12 for **new** hashes (existing hashes verify as today; rehash on login optional — default **new hashes only**).

#### US-11 (optional Phase D): CSP nonce roadmap
Out of scope for coding in P0–P2 unless approved; document spike: middleware nonce for scripts, remove `unsafe-eval` if feasible with Next 16.

---

## 6. Implementation Plan (how we will fix)

### Phase A — P0 (estimated 0.5–1 day)
| Step | Change | Files (expected) |
|------|--------|------------------|
| A1 | Increment `sessionVersion` on reset-password | `src/app/api/auth/reset-password/route.ts` |
| A2 | Optional: same on account password change when client sends `revokeOtherSessions: true`, or always revoke others and keep current via cookie refresh — **default: always increment on reset; on logged-in password change, increment and require re-login OR bump + refresh current session** (decision: **reset always bump; logged-in change bump + sign user out of other devices only by bumping, current session updated on next jwt callback within check interval** — simplest: **always bump on both reset and password change**, client calls `signOut` + re-login for password change UX already may need update) | `reset-password`, `account/password` |
| A3 | `crypto.randomInt` for OTP | `src/lib/otp.ts` |
| A4 | Dependency upgrades for Auth.js | `package.json` / lockfile |

**Logged-in password change decision (locked in this PRD):**  
Increment `sessionVersion` on password change as well, then return `{ ok: true, reauth: true }` so the client signs out and user signs in again. This matches “password changed ⇒ trust reset”. (Today’s comment intentionally kept old sessions; we reverse that for security.)

### Phase B — P1 (estimated 1–2 days)
| Step | Change | Files |
|------|--------|-------|
| B1 | Block admin `devCode` in production | `src/lib/otp.ts`, `admin/users/[id]/plan/route.ts` |
| B2 | Upgrade Next (patch) | `package.json` |
| B3 | Inquiry upload: login required for files + MIME allowlist; prefer private blob | `support/inquiry/route.ts` |
| B4 | Remove query secret in production | `src/lib/cronAuth.ts`, cron callers docs |

### Phase C — P2 (estimated 0.5–1 day)
| Step | Change |
|------|--------|
| C1 | Env-only admins + prod guard |
| C2 | Faster `sessionVersion` recheck / sensitive-route force |
| C3 | timingSafeEqual + bcrypt 12 for new hashes |

### Phase D — Optional
CSP nonce spike; remaining npm High that need force majors; KaTeX trust audit.

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Open P0 findings | 0 after Phase A |
| Open P1 findings | 0 after Phase B |
| `npm audit` Critical (`@auth/core`) | 0 |
| Password reset → old JWT usable | False after version check |
| Production admin plan OTP in JSON | Never (unless break-glass env) |
| Guest public blob uploads | 0 |

---

## 8. Scope

### In scope
Findings #1–#10 from the 2026-07 audit (session reset, Auth/Next deps, OTP RNG, admin inline OTP, hardcoded admins, inquiry upload, CSP documented deferral, cron query secret, JWT window, Low hygiene).

### Out of scope
- Full red-team / Burp campaign  
- Rewriting billing or Stripe flow (already ownership-checked)  
- Removing signup email enumeration 409 (accepted UX tradeoff unless product revisits)  
- Electron/Play Store packaging security (separate doc)

---

## 9. Technical Considerations

- **JWT + `sessionVersion`:** Keep strategy; do not switch to database sessions in this PRD.
- **Transactions:** Prefer single Prisma `update` setting both `passwordHash` and `sessionVersion: { increment: 1 }`.
- **Deps:** Prefer non-force upgrades first; record residuals.
- **Compat:** Vercel Cron must keep Bearer; breaking query secret is OK if scripts updated.
- **Admin emails:** Coordinate Vercel env **before** removing hardcoded defaults.

---

## 10. UX Notes

- Password change: may force re-login (`reauth: true`) — show toast: “비밀번호가 변경되었습니다. 다시 로그인해 주세요.”
- Admin plan change when mail fails in prod: show ops error, not on-screen code.
- Guest inquiry: if file attached without login → 401 with “첨부하려면 로그인하세요.”

---

## 11. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Admin lockout after removing hardcoded emails | Set `ADMIN_EMAILS` before deploy; temporary dual-read in one release if needed |
| Next upgrade regressions | Preview deploy + smoke checklist |
| Stricter OTP breaks local admin DX | Keep `devCode` in non-production |
| Faster session checks increase DB load | 15s interval or path-based force only |
| Private blob breaks old public inquiry links | Only new uploads; old URLs remain until GC |

---

## 12. Test Plan (verification)

1. **Reset session kill:** Two browsers; reset password in A; B’s next API call → 401.  
2. **OTP:** Unit or script assert codes from `randomInt` range; no `Math.random` in otp module.  
3. **Admin OTP prod:** `NODE_ENV=production` without mail → no `devCode` in JSON.  
4. **Cron:** Request with only `?secret=` → 401 in production.  
5. **Inquiry:** Guest multipart with file → 401; logged-in allowed types → 200.  
6. **Deps:** `npm audit` Critical cleared for auth; app smoke login.

---

## 13. Open Questions (for stakeholder)

1. ~~Password change: revoke all sessions?~~ **Decided:** Yes, force reauth.  
2. ~~Inquiry~~ **Decided:** Full inquiry requires login (not guest text-only). Attachments private Blob + MIME allowlist.  
3. Empty `ADMIN_EMAILS` in production: **warn + no admins** (must set env before deploy).  
4. ~~Phase D CSP~~ **Decided:** Included — middleware nonce CSP, no production `unsafe-inline`/`unsafe-eval` on scripts.

---

## 14. Stakeholder Sign-Off

| Role | Name | Decision | Date |
|------|------|----------|------|
| Product owner | | Approve / Request changes | |
| Engineering | | Ready to implement Phase A | |

**Implementation must not start until Status → Approved (or written approval in chat).**

---

## Appendix A — Finding → Story map

| Audit # | Severity | Story |
|---------|----------|--------|
| 1 Session after reset | High | US-01, US (password change) |
| 2 Auth.js Critical | Critical | US-03 |
| 3 Next High | High | US-05 |
| 4 Math.random OTP | High | US-02 |
| 5 Admin devCode | High | US-04 |
| 6 Hardcoded admins | Medium | US-08 |
| 7 Public inquiry upload | Medium | US-06 |
| 8 CSP unsafe-* | Medium | US-11 (Phase D) |
| 9 Query cron secret | Medium | US-07 |
| 10 JWT 60s / fail-open | Medium | US-09 |
| Low timing/bcrypt | Low | US-10 |
