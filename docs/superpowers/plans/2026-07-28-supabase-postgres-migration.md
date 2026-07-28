# Supabase Postgres Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Neon with Supabase Postgres while keeping the current Prisma schema, Auth.js adapter, and application auth behavior unchanged.

**Architecture:** The migration is an infrastructure-host swap, not an auth rewrite. First remove the Neon-specific Prisma runtime adapter so the app can boot against standard Postgres, then add operator verification tooling and cutover docs, then execute a dry run and production cutover under a short maintenance window, and finally run review gates before reopening traffic.

**Tech Stack:** Next.js 16, React 19, Prisma 7, Auth.js 5 beta, PostgreSQL, Supabase Postgres, Paymentwall, TypeScript, tsx, ESLint.

## Global Constraints

- Scope is **DB hosting migration only**.
- Keep `Auth.js + PrismaAdapter`.
- Do **not** migrate to Supabase Auth, Storage, RLS, or `@supabase/server` in this wave.
- Supabase region is **`ap-southeast-2`**.
- Migration mode is a **planned maintenance window** with restricted site access.
- Preserve Google same-email linking, credentials login, OTP, session invalidation, and Paymentwall behavior.
- Do not ship until `/review-bugbot`, `/review-security`, and accessibility audit run on the migrated app.

---

## File Map

- Modify: `src/lib/prisma.ts` — remove Neon-specific adapter, keep one global Prisma client.
- Modify: `package.json` — remove Neon runtime dependencies once `src/lib/prisma.ts` no longer uses them.
- Create: `scripts/verify-db-cutover.mts` — DB connection and table-count smoke script for auth, billing, and workspace surfaces.
- Create: `docs/runbooks/supabase-cutover.md` — operator runbook for dry run, production cutover, rollback, and review gates.
- Modify: `docs/PRD_SUPABASE_POSTGRES_MIGRATION_2026-07.md` only if implementation uncovers a necessary spec correction.
- Test: `tests/checkoutMessaging.test.ts` remains unchanged; add new script-based verification instead of route tests for infra cutover.

---

### Task 1: Remove Neon-specific Prisma runtime

**Files:**
- Modify: `src/lib/prisma.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `process.env.DATABASE_URL`
- Produces: `prisma: PrismaClient` from `src/lib/prisma.ts` with unchanged import contract for the rest of the app

- [ ] **Step 1: Write the failing runtime check**

Create a temporary one-off command by pasting this into the terminal:

```bash
npx tsx -e "import('./src/lib/prisma.ts').then(() => console.log('loaded prisma')).catch((err) => { console.error(err); process.exit(1); })"
```

Expected before the refactor (with Neon packages still required): this command loads today, but it proves the runtime is still coupled to `@neondatabase/serverless` and `@prisma/adapter-neon`.

- [ ] **Step 2: Replace Neon adapter code with standard Prisma client**

Update `src/lib/prisma.ts` to:

```ts
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Remove unused Neon runtime dependencies**

Run:

```bash
npm remove @neondatabase/serverless @prisma/adapter-neon ws
```

Expected: `package.json` no longer lists those dependencies, and the lockfile updates accordingly.

- [ ] **Step 4: Run type and boot verification**

Run:

```bash
npx tsc --noEmit
npx tsx -e "import('./src/lib/prisma.ts').then(() => console.log('loaded prisma'))"
```

Expected:

```text
loaded prisma
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prisma.ts package.json package-lock.json
git commit -m "refactor: remove Neon-specific Prisma runtime"
```

---

### Task 2: Add DB cutover smoke script

**Files:**
- Create: `scripts/verify-db-cutover.mts`

**Interfaces:**
- Consumes: `DATABASE_URL`, generated Prisma client
- Produces: CLI exit code `0` on success; non-zero on failed DB connectivity or missing critical counts

- [ ] **Step 1: Write the failing smoke script skeleton**

Create `scripts/verify-db-cutover.mts`:

```ts
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  throw new Error("not implemented");
}

main()
  .catch((err) => {
    console.error("[verify-db-cutover] FAIL", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run the script to verify it fails**

Run:

```bash
npx tsx scripts/verify-db-cutover.mts
```

Expected: exit 1 with `not implemented`.

- [ ] **Step 3: Implement minimal verification**

Replace the file with:

```ts
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function countOrThrow<T>(name: string, run: () => Promise<T>) {
  try {
    const value = await run();
    console.log(`[verify-db-cutover] ${name}:`, value);
    return value;
  } catch (err) {
    console.error(`[verify-db-cutover] ${name} failed`, err);
    throw err;
  }
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;

  await countOrThrow("users", () => prisma.user.count());
  await countOrThrow("accounts", () => prisma.account.count());
  await countOrThrow("sessions", () => prisma.session.count());
  await countOrThrow("loginEvents", () => prisma.loginEvent.count());
  await countOrThrow("userSettings", () => prisma.userSettings.count());
  await countOrThrow("orders", () => prisma.order.count());
  await countOrThrow("workspaces", () => prisma.workspace.count());
  await countOrThrow("workspaceMembers", () => prisma.workspaceMember.count());
  await countOrThrow("usageCounters", () => prisma.usageCounter.count());
  await countOrThrow("chatSessions", () => prisma.chatSession.count());
  await countOrThrow("chatHistory", () => prisma.chatHistory.count());
  await countOrThrow("libraryItems", () => prisma.libraryItem.count());

  console.log("[verify-db-cutover] OK");
}

main()
  .catch((err) => {
    console.error("[verify-db-cutover] FAIL", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 4: Run the script against the current DB**

Run:

```bash
npx tsx scripts/verify-db-cutover.mts
```

Expected: table counts print and final line is:

```text
[verify-db-cutover] OK
```

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-db-cutover.mts
git commit -m "chore: add Supabase cutover verification script"
```

---

### Task 3: Document cutover and rollback runbook

**Files:**
- Create: `docs/runbooks/supabase-cutover.md`

**Interfaces:**
- Consumes: `docs/PRD_SUPABASE_POSTGRES_MIGRATION_2026-07.md`, `scripts/verify-db-cutover.mts`
- Produces: executable operator instructions for dry run, production cutover, rollback, and review gates

- [ ] **Step 1: Create the runbook with exact sections**

Create `docs/runbooks/supabase-cutover.md`:

```md
# Supabase Postgres Cutover Runbook

## Preconditions

- Supabase Postgres project ready in `ap-southeast-2`
- Production site access restriction method prepared
- Fresh Neon backup/export path verified
- New Supabase `DATABASE_URL` stored securely

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
2. Confirm no active admin writes or billing operations in progress.
3. Export Neon production DB.
4. Import into Supabase production project.
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
2. Restore old Neon `DATABASE_URL`.
3. Redeploy previous runtime.
4. Run smoke tests again.
5. Keep Supabase investigation artifacts for the next attempt.
```

- [ ] **Step 2: Review the runbook for missing commands**

Run:

```bash
rg "TBD|TODO|later|placeholder" docs/runbooks/supabase-cutover.md
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add docs/runbooks/supabase-cutover.md
git commit -m "docs: add Supabase cutover runbook"
```

---

### Task 4: Execute lower-environment dry run

**Files:**
- Modify: host environment settings only
- Uses: `scripts/verify-db-cutover.mts`

**Interfaces:**
- Consumes: Supabase non-production `DATABASE_URL`
- Produces: a verified dry-run report captured in PR comments or notes

- [ ] **Step 1: Point a lower environment to Supabase**

Update the lower environment:

```bash
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres?sslmode=require
```

- [ ] **Step 2: Run build and DB verification**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run build
npx tsx scripts/verify-db-cutover.mts
```

Expected:

```text
[verify-db-cutover] OK
```

- [ ] **Step 3: Perform manual application smoke tests**

Manually verify:

```text
1. Google login succeeds
2. Email/password login succeeds
3. Password completion succeeds for a Google-only account
4. Google unlink is blocked without password fallback
5. /api/checkout creates a pending order
6. Paymentwall pingback grants or revokes plan correctly
7. Workspace create/invite/join works
```

- [ ] **Step 4: Commit operator notes**

Create a short note in the PR or a runbook appendix with:

```md
- exact Supabase connection mode used
- dry-run execution timestamp
- smoke test results
- any schema or SSL issues found
```

No git commit required if this is posted in the PR; if saved to a repo doc, commit it.

---

### Task 5: Production cutover and release gate

**Files:**
- Modify: production environment settings only
- Uses: `docs/runbooks/supabase-cutover.md`
- Uses: `scripts/verify-db-cutover.mts`

**Interfaces:**
- Consumes: production Supabase `DATABASE_URL`, maintenance restriction capability
- Produces: production on Supabase Postgres with review gates completed

- [ ] **Step 1: Restrict traffic and perform DB cutover**

Follow exactly:

```text
1. Restrict site access
2. Export Neon production DB
3. Import into Supabase
4. Update production DATABASE_URL
5. Redeploy
```

- [ ] **Step 2: Run production verification**

Run:

```bash
npx tsx scripts/verify-db-cutover.mts
```

Expected:

```text
[verify-db-cutover] OK
```

- [ ] **Step 3: Run review gates before reopening traffic**

Run, in order:

```text
1. /review-bugbot
2. /review-security
3. accessibility audit
```

Expected: no blocking findings remain unresolved.

- [ ] **Step 4: Re-open traffic and revoke Neon**

Operator actions:

```text
1. Re-open public traffic
2. Revoke Neon credentials
3. Archive the final Neon backup securely
```

- [ ] **Step 5: Commit**

If repo docs are updated with final migration notes:

```bash
git add docs/runbooks/supabase-cutover.md docs/PRD_SUPABASE_POSTGRES_MIGRATION_2026-07.md
git commit -m "docs: record Supabase production cutover outcome"
```

If no repo files changed, skip the commit and document the outcome in the PR.

---

## Self-Review

- Spec coverage: tasks cover runtime refactor, dry run, production cutover, rollback, validation, and review gates.
- Placeholder scan: no `TBD`, `TODO`, or vague "handle later" language remains.
- Type consistency: all tasks use the same outputs — `prisma` from `src/lib/prisma.ts`, `scripts/verify-db-cutover.mts`, and the documented review gates.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-28-supabase-postgres-migration.md`. Two execution options:

1. **I can implement it here** on a fresh branch, task-by-task.
2. **I can hand it to a subagent/executor** to run the plan with checkpoints.
