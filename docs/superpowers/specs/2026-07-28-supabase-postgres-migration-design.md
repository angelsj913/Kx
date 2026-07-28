# Supabase Postgres Migration - Design Spec

Companion to `docs/PRD_SUPABASE_POSTGRES_MIGRATION_2026-07.md`.

## Approved decisions

| Topic | Decision |
|-------|----------|
| Scope | Neon DB only -> Supabase Postgres |
| Auth | Keep `Auth.js + PrismaAdapter` |
| Downtime model | Short maintenance window allowed |
| User access during cutover | Restricted by operator |
| Supabase region | `ap-southeast-2` |
| Security posture | Keep auth model stable, harden infra/ops |

## Architecture delta

### Before

`src/lib/prisma.ts`

- imports `@neondatabase/serverless`
- imports `@prisma/adapter-neon`
- configures websocket constructor
- constructs Prisma client with `PrismaNeon({ connectionString })`

### After

`src/lib/prisma.ts`

- no Neon-specific imports
- Prisma client created for standard Postgres / supported runtime path
- `DATABASE_URL` points to Supabase Postgres

## Why no auth migration

Auth behavior depends on current Prisma-backed server logic:

- `PrismaAdapter(prisma)`
- Google same-email linking
- bcrypt credentials auth
- optional OTP 2FA
- JWT `sessionVersion`
- login event recording
- Google unlink password fallback

Rewriting that during DB cutover would mix infra risk with identity risk.

## Tables/surfaces to explicitly verify

### P0 auth/data integrity

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `LoginEvent`
- `UserSettings`

### P0 billing

- `Order`

### P1 collaboration / product continuity

- `Workspace`
- `WorkspaceMember`
- `WorkspaceInvite`
- `UsageCounter`
- `ChatSession`
- `ChatHistory`
- `LibraryItem`

## Cutover shape

1. Restrict traffic.
2. Confirm last safe write point.
3. Export Neon.
4. Import to Supabase.
5. Update production `DATABASE_URL`.
6. Redeploy.
7. Run P0 smoke tests.
8. Run review gates: `/review-bugbot`, `/review-security`, accessibility audit.
9. Re-open traffic.
10. Revoke Neon credentials.

## Connection/config notes to resolve during implementation

- direct URL vs pooled URL for Prisma runtime
- SSL requirements for Supabase connection string
- whether build-time Prisma step uses same runtime URL
- backup retention / snapshot method before cutover

## Out of scope for this design

- RLS rollout for app traffic
- Supabase Auth
- Supabase Storage
- `@supabase/server` route refactors

## Release gate

Do not mark the migration complete until all three pass on the migrated app:

- Bugbot review
- Security review
- Accessibility audit

