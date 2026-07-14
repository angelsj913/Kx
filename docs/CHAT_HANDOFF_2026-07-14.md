# ZEFF AI / Kx — Chat Handoff Document

**Purpose:** Give another AI (or developer) enough context to continue this project conversation without the prior chat history.

**Date of handoff:** 2026-07-14  
**Repo:** https://github.com/angelsj913/Kx  
**Production site:** https://zeffai.com  
**Workspace path (this environment):** `/root/Kx`  
**User language:** Korean (respond in Korean unless they switch)

---

## 1. What this product is

**ZEFF AI** is a personal AI workspace web app (Next.js) with:

- Cloud backend (Vercel + Neon Postgres + Prisma)
- Official marketing homepage + authenticated app workspace
- **Thin clients** that load the live web app (no AI keys in the client package):
  - **Windows desktop:** Electron → `https://zeffai.com` (installer `zeffai.installer.exe`)
  - **Android (in progress):** Capacitor → `https://zeffai.com/login` (package `com.zeffai.app`)

Earlier work in prior sessions also covered: i18n (8 languages), support UI, shared library, chat labels/perf, receipt UI, file preview, terms/dormant/admin AI, homepage copy, etc.

---

## 2. Stack (current)

| Layer | Tech |
|--------|------|
| Web | Next.js **16.2.10**, React 19, Tailwind 4 |
| Auth | next-auth v5 beta |
| DB | Prisma **7.8**, Neon serverless adapter |
| Hosting | Vercel |
| Desktop | Electron + electron-builder (NSIS) |
| Mobile | Capacitor 8 + Android project |
| Payments | Stripe (web checkout on zeffai.com) |
| Repo default branch used for deploy | **`main`** |

**Important Prisma notes:**

- Client output: `src/generated/prisma` (not default `node_modules`)
- `postinstall`: `prisma generate` (required for Vercel)
- Build script (fixed 2026-07-14):  
  `"build": "prisma generate && prisma db push && next build"`  
  **Do not** use `prisma db push --skip-generate` — removed in Prisma 7.8 and **broke Vercel builds**.

---

## 3. Conversation timeline (this chat + compacted prior context)

### A. Desktop Windows installer (prior session → this chat)

- User wanted branded Windows `.exe` with **zeffai** in the filename, pointing at **https://zeffai.com**
- Terms gate, in-app login, same features as web; payment/terms open official site
- Cloud-only delivery (build on GitHub Actions, no local Windows required for release)
- Live installer (from earlier work):  
  `https://github.com/angelsj913/Kx/releases/latest/download/zeffai.installer.exe`  
  (~218MB, tag pattern like `desktop-v*`)
- Workflow: `.github/workflows/build-windows-installer.yml`
- **Code signing:** User asked what it is and why expensive
  - OV ~$200–450/yr, EV ~$250–700+/yr historically
  - Hardware token/HSM required since ~2023 (CA/B Forum)
  - EV no longer gives instant SmartScreen bypass (policy change ~2024)
  - **Cheapest paths discussed:** Azure Artifact Signing (~$9.99/mo, **geo-limited**), traditional OV resellers, or **Microsoft Store MSIX** (no CA cert purchase; MS re-signs)
  - User: “why so expensive?” → explained identity validation + HSM monopoly
  - User: “cheapest cert?” → Azure if eligible, else OV ~$200–300/yr; skip EV for SmartScreen alone
  - User: “can we hide warnings without signing?” → **No** for public `.exe`; only Store re-sign or signing + reputation
  - User: “Store is cheapest for trust?” → **Yes for cert cost**, but packaging work + optional dev account fee
  - User: “is cert paid yearly upfront?” → Traditional CA **yes annual prepaid**; Azure monthly; Store no CA yearly fee
  - User: “how to put on Store?” → Partner Center, MSIX, identity match, submit (explained; not fully implemented for MSIX)

### B. Pivot: skip Windows cert, do Android + Play Store

User decision: **don’t buy code signing cert; build mobile app and put on Google Play.**

Implemented:

| Item | Detail |
|------|--------|
| App ID | `com.zeffai.app` |
| Shell | Capacitor 8 thin client → `https://zeffai.com/login` |
| Config | `capacitor.config.ts` |
| Fallback web | `mobile/www/index.html` |
| Native project | `android/` (committed) |
| Docs | `docs/PLAY_STORE.md` |
| CI template | `docs/ci/build-android.yml` (**not** under `.github/workflows/` on push — see below) |
| Landing | Android CTA (Play URL empty = “soon”) |
| Constants | `PLAY_STORE_URL`, `ANDROID_PACKAGE_ID` in `src/lib/constants.ts` |
| Asset links stub | `public/.well-known/assetlinks.json` (SHA256 placeholder) |

**GitHub PAT limitation:** Token lacks `workflow` scope → cannot push files under `.github/workflows/`. Android CI lives at `docs/ci/build-android.yml`; user (or token with workflow scope) must copy to `.github/workflows/build-android.yml`.

**Play cost guidance given:**

- Play developer registration ~**$25 one-time**
- No Windows-style annual Authenticode cert required for Play upload signing (upload keystore is free/self-generated; Play App Signing free)
- **Individual vs Organization** account: recommend Organization if they have a business registration; Individual OK to start without
- **D-U-N-S:** Explained as Dun & Bradstreet 9-digit business ID often required for **organization** developer accounts (Apple/Google), not needed for personal accounts usually

**Not finished for Play:**

- User has not completed Play Console registration
- No upload keystore secrets in GitHub yet
- AAB not necessarily published
- `PLAY_STORE_URL` still `""`
- Deep link assetlinks fingerprint still placeholder

### C. Homepage large-monitor scaling

User: large monitors make official homepage UI too small → want auto scale.

Implemented:

1. `LandingViewportScale` on homepage (`src/app/page.tsx`)
2. Scales via `document.documentElement` **font-size** (rem-based Tailwind scales together)
3. User then asked: **separate mobile vs desktop ratio settings**

Implemented:

- Config: **`src/lib/landingScale.ts`** (`LANDING_SCALE`)
- Runner: `src/components/landing/LandingViewportScale.tsx`
- Defaults:
  - **mobile** (≤767): `fixed: true`, scale **1**
  - **tablet** (768–1023): `fixed: true`, scale **1**
  - **desktop** (≥1024): scale from width/1536 starting ~1280, **max 1.55**

### D. Vercel build failure (latest)

```
prisma db push --skip-generate
! unknown or unexpected option: --skip-generate
Error: Command "npm run build" exited with 1
```

**Fix pushed:** remove `--skip-generate` from `package.json` build script.  
Commit: `60ec90e` on `main`.

---

## 4. Important repo paths

```
/root/Kx/
  package.json                 # build/scripts, Capacitor + Electron
  capacitor.config.ts          # Android thin client URL/allowNavigation
  android/                     # Capacitor Android project
  mobile/www/                  # Offline fallback HTML
  electron/main.js             # Desktop thin client → zeffai.com/login
  docs/PLAY_STORE.md           # Play submission guide (Korean)
  docs/ci/build-android.yml    # Copy to .github/workflows/ when possible
  docs/CHAT_HANDOFF_*.md       # This handoff
  src/lib/landingScale.ts      # Mobile/desktop homepage scale presets
  src/lib/constants.ts         # Download URLs, PLAY_STORE_URL, legal URLs
  src/components/landing/      # Homepage sections + LandingViewportScale
  src/app/page.tsx             # Landing wrapped in LandingViewportScale
  .github/workflows/build-windows-installer.yml
```

---

## 5. Git / deploy state (at handoff)

| Item | Value |
|------|--------|
| Latest commits discussed | `60ec90e` (Prisma build fix), `60d8264` (landing scale split), `e134b22` (landing scale), Android shell commits |
| Branch often used in session | `feat/workspace-ops-polish` tracking remote; **production pushes went to `main`** |
| Local stash | May exist: `wip local before merge main` (uncommitted WIP stashed during merge) — check `git stash list` |
| Vercel | Deploys from GitHub `main`; after `60ec90e` build should pass Prisma flag error |

**Security note from earlier session:** A GitHub PAT was used/exposed for push; user was advised to **revoke/regenerate** if it was leaked in logs.

---

## 6. User preferences & decisions (do not re-argue unless asked)

1. **Prefer low cost** for distribution trust (avoid expensive Windows EV/OV if possible).
2. **Pivot away from Windows code signing purchase** toward **Android Play Store** path.
3. Official brand URL always **https://zeffai.com**.
4. Desktop/mobile clients are **shells** over the cloud web app (not offline full AI).
5. Communication **in Korean**.
6. Homepage should scale better on big monitors; mobile and desktop scales **configured separately**.

---

## 7. Open / next tasks (suggested)

Priority depends on user; logical next steps:

1. **Confirm Vercel deploy green** after `60ec90e`.
2. **Play Store path:**
   - User creates Play Console account (Individual vs Org; D-U-N-S if Org)
   - Generate upload keystore; optional GitHub secrets
   - Copy `docs/ci/build-android.yml` → `.github/workflows/build-android.yml` (or use workflow-scoped PAT)
   - Build signed AAB, internal testing, store listing, privacy URL already:  
     `https://zeffai.com/support/legal#privacy`
   - Set `PLAY_STORE_URL` when live
3. **Optional:** Custom Android icons from ZEFF logo (still default Capacitor icons).
4. **Optional:** Windows MSIX / Microsoft Store later (user explored conceptually).
5. **Optional:** Tune `LANDING_SCALE` numbers if they want stronger/weaker desktop zoom.
6. **Mac desktop** was “coming soon” — not primary focus now.
7. Do **not** implement Windows SmartScreen bypass without legitimate signing/Store.

---

## 8. Commands cheat sheet

```bash
# Web
npm ci
npm run dev
npm run build   # generate + db push + next build

# Windows installer (CI or Windows machine)
npm run electron:build:win

# Android
npm run android:sync
npm run android:bundle   # needs Android SDK + optional keystore.properties
npm run android:open     # Android Studio

# Scale tuning
# Edit src/lib/landingScale.ts only
```

---

## 9. Constants to remember

```ts
// src/lib/constants.ts (concepts)
OFFICIAL_SITE = "https://zeffai.com"
WINDOWS_FILENAME = "zeffai.installer.exe"
ANDROID_PACKAGE_ID = "com.zeffai.app"
PLAY_STORE_URL = ""  // fill after Play listing is public
LEGAL_PRIVACY_URL = "https://zeffai.com/support/legal#privacy"
```

Electron / Capacitor entry: **`/login`** on production origin.

---

## 10. How the other AI should continue

1. Read this file + `docs/PLAY_STORE.md` + `src/lib/landingScale.ts` + `capacitor.config.ts`.
2. Check `git status`, `main` tip, and latest Vercel deployment.
3. Ask the user only if blocked (Play account type, keystore passwords, etc.).
4. Prefer small, targeted changes; don’t reintroduce `db push --skip-generate`.
5. Respond in **Korean** by default.
6. For Play/Store money decisions, restate tradeoffs briefly; user already chose cost-sensitive Android path over Windows OV/EV.

---

## 11. One-line project status

**ZEFF AI web is live; Windows thin-client installer ships unsigned via GitHub Releases; Android Capacitor shell + Play docs are on `main`; homepage has separate mobile/desktop scale presets; last infra fix removed invalid Prisma 7 `db push` flag so Vercel can build again.**

---

*End of handoff. Generated for chat continuation, 2026-07-14.*
