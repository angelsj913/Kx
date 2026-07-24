<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

ZEFF AI is one Next.js 16 (App Router, Turbopack) product shipped as web + Electron + Capacitor/Android. Package manager is **npm** (`.npmrc` sets `legacy-peer-deps=true`). Standard commands live in `package.json`: `npm run dev` (port 3000), `npm run lint`, `npm run build`, `npm start`. There is no automated test suite.

### Database: app only talks to Postgres over the Neon serverless WebSocket
`src/lib/prisma.ts` uses `@prisma/adapter-neon`, so at runtime the app connects to `wss://<host>/v2` and tunnels the Postgres protocol — it never opens a plain TCP connection. There is no built-in local/TCP fallback, so local dev needs a local Postgres **plus** a WebSocket bridge. `scripts/local-neon-wsproxy.mjs` (dev-only, added for this) terminates `wss` and pipes to local Postgres; it self-generates a cert into `.local-neon/` (gitignored). Non-obvious gotchas:
- The Neon client pipelines a **cleartext password** (`pipelineConnect: "password"`), so local `pg_hba.conf` host rules must use `password` auth (not `trust`), and the role password must match `DATABASE_URL`.
- The dev server AND `prisma` CLI must run with `NODE_EXTRA_CA_CERTS=/workspace/.local-neon/cert.pem` so the self-signed wss cert is trusted.
- The Neon client uses `wss` on port **443**; binding 443 as non-root needs `sudo sysctl -w net.ipv4.ip_unprivileged_port_start=443` (does not persist across reboot — re-run each session).
- `prisma` CLI (`db push`) connects **directly** (not via Neon), so it needs `?sslmode=disable` against the non-TLS local Postgres; the Neon adapter ignores pg SSL (`forceDisablePgSSL`), so the same `DATABASE_URL` works for the app.

### Starting the stack (services are NOT started by the update script)
The Postgres binary, the `~/pgdata` cluster, and `.env.local` persist in the VM snapshot. If present, just start services; otherwise recreate. Startup:
1. `export PATH="/usr/lib/postgresql/16/bin:$PATH"` then `pg_ctl -D ~/pgdata -l ~/pgdata/server.log -o "-p 5432 -k /tmp" start` (first-time only: `initdb -D ~/pgdata -U postgres --auth=trust`, create role `zeff`/db `zeff`, and set the two `127.0.0.1`/`::1` host lines in `~/pgdata/pg_hba.conf` to `password`, then reload).
2. `sudo sysctl -w net.ipv4.ip_unprivileged_port_start=443`
3. `node scripts/local-neon-wsproxy.mjs &` (bridge; regenerates its cert if missing).
4. `export NODE_EXTRA_CA_CERTS=/workspace/.local-neon/cert.pem` then `npm run dev`.

`.env.local` must contain `DATABASE_URL="postgresql://zeff:zeff@localhost:5432/zeff?sslmode=disable"` and an `AUTH_SECRET` (`openssl rand -base64 32`). Apply schema with `npx prisma db push` (there are no migrations — the project uses `db push`).

### Auth / email / AI in local dev
- No SMTP/Resend needed: in non-production the signup/reset **OTP code is returned inline** as `devCode` and shown on the `/signup` page.
- Login supports Google OAuth (needs `AUTH_GOOGLE_ID/SECRET`) and email/password Credentials; the credentials path works with no external secrets.
- AI chat/generation needs `GEMINI_API_KEY` (or a fallback provider key); without it those calls fail, but auth, workspaces, library, and RAG (deterministic local-embedding fallback) still work. UI is Korean by default.
