# PRD: Neon -> Supabase Postgres Migration

| Field | Value |
|-------|--------|
| **Status** | Draft - approved for spec writing, implementation not started |
| **Date** | 2026-07-28 |
| **Owner** | Product owner + engineering |
| **Scope** | Database hosting migration only |
| **Decision** | Keep `Auth.js + Prisma`, replace Neon with Supabase Postgres |
| **Supabase region** | `ap-southeast-2` |
| **Migration mode** | Planned maintenance window with restricted site access |
| **Design spec** | `docs/superpowers/specs/2026-07-28-supabase-postgres-migration-design.md` |

---

## 1. Executive Summary

ZEFF AI currently uses Prisma against a Postgres database via Neon-specific adapter code in `src/lib/prisma.ts`. The approved direction is to remove Neon and use **Supabase Postgres as the only database backend**, while preserving the current application auth model (`Auth.js`, Prisma models, Google account linking, credentials login, session invalidation, and payment flows). The goal is to change the database host **without changing the security model**.

This PRD defines the migration goals, constraints, rollout steps, rollback, and validation checklist. No implementation starts until this document is reviewed.

---

## 2. Current State

### Database runtime

- Prisma schema uses `provider = "postgresql"` and is host-agnostic at the schema level.
- Runtime client is **not** host-agnostic today: `src/lib/prisma.ts` imports `@neondatabase/serverless`, `@prisma/adapter-neon`, and `ws`, then constructs a `PrismaNeon` adapter from `DATABASE_URL`.

### Auth and security coupling

The app's auth/security behavior is tightly bound to existing Prisma tables and server-side logic:

- `Auth.js` + `PrismaAdapter(prisma)`
- Google OAuth + Credentials login on one user record
- same-email Google linking policy
- bcrypt password verification
- optional email OTP 2FA
- JWT `sessionVersion` invalidation
- login event recording

This means DB migration should preserve Prisma models and rows exactly, rather than re-platform auth in the same wave.

### Other critical DB-backed surfaces

- Paymentwall checkout / pingback (`orders`, `userSettings`)
- Workspace and invitation flows
- Usage counters / quotas
- Chat history and library items

---

## 3. Goals

1. Replace Neon with Supabase Postgres as the only DB backend.
2. Preserve existing auth and account-linking behavior.
3. Minimize security risk by avoiding auth migration in the same wave.
4. Use a short maintenance window instead of live dual-write complexity.
5. Rotate credentials and decommission Neon access after cutover.

---

## 4. Non-goals

- Migrating to Supabase Auth
- Migrating to Supabase Storage
- Rewriting Prisma models to direct Supabase JS clients
- Introducing Row Level Security for application traffic in this wave
- Edge Functions / `@supabase/server` adoption in this wave

---

## 5. Recommended Approach

### Approach selected: "DB migration + operational hardening"

Keep the current application contract and swap the database host beneath it.

### What changes

- `DATABASE_URL` changes from Neon connection string to Supabase Postgres connection string.
- `src/lib/prisma.ts` is refactored to remove Neon-specific adapter usage.
- Environment, backup, password rotation, and rollback procedures are formalized.

### What stays the same

- Prisma schema
- Auth.js adapter and session flow
- Google login / unlink flows
- Paymentwall logic
- App-level authorization rules

---

## 6. Security Rationale

This approach is selected specifically because it reduces migration risk in the most sensitive layer.

### Why this is safer than DB+Auth migration

- Current auth behavior is heavily customized in application code.
- Google same-email linking is explicitly allowed and depends on current adapter behavior.
- Credentials auth, OTP, session invalidation, and account unlink preconditions already exist and should not be reimplemented during infra migration.

### Additional security controls in this wave

1. Generate new Supabase DB credentials.
2. Restrict site access during cutover.
3. Freeze writes during export/import.
4. Verify auth-critical tables and row counts before opening traffic.
5. Rotate or revoke old Neon credentials after successful cutover.

---

## 7. Detailed Plan

### Phase A - Preparation

- Create a production readiness checklist.
- Capture current DB size, table counts, and auth-critical row counts.
- Provision Supabase Postgres connection info in `ap-southeast-2`.
- Decide connection mode for Prisma (direct Postgres URL / pooled URL) and document it.
- Prepare temporary site restriction / maintenance mode.

### Phase B - Application runtime change

- Replace Neon adapter code in `src/lib/prisma.ts`.
- Remove Neon-specific dependencies if no longer required.
- Verify local / preview boot with Supabase-backed `DATABASE_URL`.

### Phase C - Dry run

- Export from a representative DB copy or lower environment.
- Restore into Supabase.
- Run `prisma generate`, `prisma db pull`/validation as needed.
- Execute smoke tests:
  - Google login
  - credentials login
  - password completion
  - Google unlink
  - checkout order creation
  - pingback processing
  - workspace CRUD

### Phase D - Production cutover

- Restrict site access.
- Confirm no writes in flight.
- Export Neon production DB.
- Restore into Supabase.
- Update production `DATABASE_URL`.
- Redeploy.
- Run post-cutover validation checklist.
- Re-open traffic.

### Phase E - Decommission

- Revoke Neon credentials.
- Archive final backup artifacts securely.
- Remove Neon-specific packages/config from codebase.

---

## 8. Rollback

If validation fails after cutover:

1. Keep site restricted.
2. Point `DATABASE_URL` back to Neon.
3. Redeploy previous runtime.
4. Re-run auth + payment smoke tests.
5. Investigate before reattempting cutover.

Rollback is only reliable because this wave does **not** change auth model or application data shape.

---

## 9. Acceptance Criteria

### Functional

- App boots using Supabase Postgres only.
- Auth.js login works without behavior regression.
- Google account linking / unlinking still works.
- Paymentwall order creation and pingback still persist correctly.
- Workspace, usage, and chat flows still read/write.

### Security

- No Neon credentials remain active in production runtime after success.
- Supabase DB credentials are rotated and stored in host env only.
- No client-side direct DB access is introduced.
- Session, OTP, and account-linking behaviors remain unchanged.

### Operational

- Cutover and rollback checklists exist.
- Maintenance window steps are documented.
- Production validation checklist is executable by an operator.

---

## 10. Risks

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Prisma runtime still depends on Neon adapter | App may fail at boot even with new `DATABASE_URL` | Refactor `src/lib/prisma.ts` first in lower env |
| Connection string mismatch (SSL/pooling) | Runtime boot/query failures | Validate exact Supabase connection mode before cutover |
| Partial import / inconsistent restore | Auth/payment data corruption | Freeze writes and verify counts before reopen |
| Long maintenance window | User disruption | Rehearse on dry run and script the sequence |
| Latency increase (`ap-southeast-2`) | Slower app if users are far from Sydney | Measure login and query latency before/after cutover |

---

## 11. Required Validation Checklist

- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build` with Supabase-backed DB env
- [ ] Google login succeeds
- [ ] Credentials login succeeds
- [ ] Complete-password flow succeeds
- [ ] Google unlink precondition still enforced
- [ ] `/api/checkout` creates pending order
- [ ] Paymentwall pingback updates plan/order
- [ ] Workspace create/invite/join flow succeeds

---

## 12. Implementation Output

If implementation is approved later, deliverables should include:

- Runtime refactor away from Neon adapter
- Env variable migration instructions
- Dry-run script/checklist
- Production cutover runbook
- Rollback runbook
- Post-cutover verification notes

