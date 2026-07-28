# Supabase Postgres Cutover Runbook

## Preconditions

- Supabase Postgres project ready in `ap-southeast-2`
- Production site access restriction method prepared
- Fresh Neon backup/export path verified
- New Supabase `DATABASE_URL` stored securely
- Application branch with `@prisma/adapter-pg` migration code deployed to a lower environment

## Dry Run

1. Export non-production or representative Neon data.
2. Import into Supabase.
3. Set `DATABASE_URL` to Supabase in a lower environment.
4. Run:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm run build`
   - `npx tsx scripts/verify-db-cutover.mts`
5. Verify:
   - Google login
   - credentials login
   - complete-password flow
   - Google unlink
   - checkout pending order creation
   - Paymentwall pingback handling
   - workspace create/invite/join

## Production Cutover

1. Restrict public site access.
2. Confirm no active admin writes or billing operations are in progress.
3. Export Neon production DB.
4. Import into Supabase.
5. Update production `DATABASE_URL`.
6. Redeploy application.
7. Run `npx tsx scripts/verify-db-cutover.mts`.
8. Run smoke tests for auth, billing, workspaces, and chat.
9. Run review gates:
   - `/review-bugbot`
   - `/review-security`
   - accessibility audit
10. Re-open traffic.
11. Revoke old Neon credentials.

## Rollback

1. Restrict site access again.
2. Restore the old Neon `DATABASE_URL`.
3. Redeploy the previous runtime.
4. Re-run smoke tests:
   - Google login
   - credentials login
   - checkout order creation
   - Paymentwall pingback handling
5. Keep Supabase investigation artifacts for the next attempt.

## Notes to capture during execution

- Exact Supabase connection mode used
- Dry-run execution timestamp
- Smoke test results
- Any schema, SSL, or pooling issues found
