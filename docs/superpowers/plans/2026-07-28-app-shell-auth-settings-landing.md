# App Shell · Auth · Settings · Landing Experience Implementation Plan

| Field | Value |
|-------|--------|
| **Status** | **DONE** — all tasks 1–11 complete on branch `cursor/app-shell-auth-landing-a14a` |
| **Done** | 2026-07-28 |

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.
>
> **Spec:** [`docs/superpowers/specs/2026-07-28-app-shell-auth-settings-landing-design.md`](../specs/2026-07-28-app-shell-auth-settings-landing-design.md)  
> **PRD:** [`docs/PRD_APP_SHELL_AUTH_SETTINGS_2026-07.md`](../../PRD_APP_SHELL_AUTH_SETTINGS_2026-07.md)  
> **Branch:** create/work on `cursor/app-shell-auth-landing-a14a` off `main` (docs PR `#58` may merge first or cherry-pick docs).

**Goal:** Ship waves A→I: chat resize clamp, admin discovery, Google+password same-user linking, Settings General redesign, Feature+Skills throttle, landing IA reorder, hero video + light 3D.

**Architecture:** App-shell fixes are isolated flex/clamp helpers. Auth extends Auth.js + Prisma `User.passwordHash` / `Account` with a `/signup?from=google` completion path and Settings link/unlink APIs. Landing reuses `useScrollProgress` from `src/lib/landingScroll.ts`, remounts FeatureShowcase + throttled SkillsSection via a new `page.tsx` IA, and adds replaceable `public/landing` media.

**Tech Stack:** Next.js (repo version), Auth.js / NextAuth, Prisma, React client components, Tailwind, existing `landingScroll` RAF lerp (no lodash throttle), optional lightweight three/r3f only if already acceptable dependency — prefer CSS 3D first.

## Global Constraints

- Never hardcode `zeff@zeffai.com` in source; use `ADMIN_EMAILS` env only.
- Do not relax `/admin/security` MFA (`requireSecurityPage`).
- No live Higgsfield API; `/design` stays marketing.
- Auth model: **one User per email**, Google + credentials both attached.
- Landing tokens: Noto / white / blue `#2563EB`; avoid purple-on-white, cream+serif terracotta, broadsheet looks.
- Hero first viewport: brand + one H1 + one sentence + one CTA group + full-bleed media — no cards/stats in hero.
- `prefers-reduced-motion`: static posters / no video autoplay / no 3D.
- Verify each wave: `npm run lint`, `npx tsc --noEmit`, `npm run eval:ai` before commit when touching `src/` or eval goldens.
- Follow `/using-superpowers` + relevant skills (`frontend-design` for E/F/G/H/I UI).

---

## File map

| Area | Create | Modify |
|------|--------|--------|
| A clamp | `src/lib/chatPanelLayout.ts` | `ChatWorkspace.tsx` |
| B admin | — | `ProfileMenu.tsx`, `Sidebar.tsx`, `SettingsModal.tsx`, `Header.tsx` |
| C auth | `src/app/api/auth/complete-password/route.ts` (if needed) | `auth.ts`, `login/page.tsx`, `signup/page.tsx`, signup API |
| D link | `src/app/api/account/oauth/link/route.ts`, unlink route | `SecurityPanel.tsx` |
| E general | — | `SettingsModal.tsx` GeneralPanel, i18n |
| F feature | — | `FeatureShowcase.tsx`, i18n |
| G skills | — | `SkillsSection.tsx` |
| H IA | — | `src/app/page.tsx`, Header anchors |
| I media | `public/landing/hero-loop.mp4`, poster, `LandingLight3D.tsx` | `Hero.tsx` |

---

### Task 1: Wave A — panel clamp helper + tests

**Files:**
- Create: `src/lib/chatPanelLayout.ts`
- Create: `docs/eval/golden/layout.json` (or extend an existing golden suite)
- Modify: `scripts/eval-ai.mts` (handler for `chat_panel_clamp` type)
- Modify: `docs/eval/golden/manifest.json` if required by harness

**Interfaces:**
- Produces: `clampPanelWidth({ containerWidth, sidebarWidth, panelWidth, chatMin?, panelMin?, panelMax?, gutter? }): { width: number; shouldCollapse: boolean }`

- [x] **Step 1: Add pure helper**

```ts
// src/lib/chatPanelLayout.ts
export const CHAT_MIN_DEFAULT = 320;
export const PANEL_MIN_DEFAULT = 240;
export const PANEL_MAX_DEFAULT = 560;

export function clampPanelWidth(input: {
  containerWidth: number;
  sidebarWidth: number;
  panelWidth: number;
  chatMin?: number;
  panelMin?: number;
  panelMax?: number;
  gutter?: number;
}): { width: number; shouldCollapse: boolean } {
  const chatMin = input.chatMin ?? CHAT_MIN_DEFAULT;
  const panelMin = input.panelMin ?? PANEL_MIN_DEFAULT;
  const panelMax = input.panelMax ?? PANEL_MAX_DEFAULT;
  const gutter = input.gutter ?? 8;
  const maxPanel = Math.min(
    panelMax,
    input.containerWidth - input.sidebarWidth - chatMin - gutter,
  );
  if (maxPanel < panelMin) {
    return { width: panelMin, shouldCollapse: true };
  }
  const width = Math.min(maxPanel, Math.max(panelMin, input.panelWidth));
  return { width, shouldCollapse: false };
}
```

- [x] **Step 2: Add eval golden cases**

```json
[
  {
    "id": "clamp-ok",
    "type": "chat_panel_clamp",
    "input": { "containerWidth": 1200, "sidebarWidth": 288, "panelWidth": 400 },
    "expectWidth": 400,
    "expectCollapse": false
  },
  {
    "id": "clamp-shrink",
    "type": "chat_panel_clamp",
    "input": { "containerWidth": 900, "sidebarWidth": 288, "panelWidth": 560 },
    "expectWidth": 284,
    "expectCollapse": false
  },
  {
    "id": "clamp-collapse",
    "type": "chat_panel_clamp",
    "input": { "containerWidth": 700, "sidebarWidth": 288, "panelWidth": 320 },
    "expectCollapse": true
  }
]
```

Wire `chat_panel_clamp` in `scripts/eval-ai.mts` importing `clampPanelWidth`.

- [x] **Step 3: Run eval**

Run: `npm run eval:ai`  
Expected: new goldens PASS; total failed = 0.

- [x] **Step 4: Commit**

```bash
git add src/lib/chatPanelLayout.ts docs/eval/golden scripts/eval-ai.mts
git commit -m "feat(layout): clampPanelWidth helper + eval goldens (wave A)"
```

---

### Task 2: Wave A — wire ChatWorkspace resize clamp

**Files:**
- Modify: `src/components/ChatWorkspace.tsx` (near `PANEL_*` constants ~76–82, state ~507–510, drag ~606+)
- Modify: `src/app/app/page.tsx` only if sidebar width must be measured from parent (prefer measuring in ChatWorkspace via ref on flex row)

**Interfaces:**
- Consumes: `clampPanelWidth` from Task 1
- Sidebar expanded width is `w-72` (288px) / collapsed `w-16` (64px) — pass measured or known width

- [x] **Step 1: Add resize effect after panel state**

```tsx
// Inside ChatWorkspace, after panelWidth/panelOpen state:
useEffect(() => {
  const shell = document.getElementById("app-chat-shell"); // ensure parent sets id, or use ref
  const apply = () => {
    const containerWidth = shell?.clientWidth ?? window.innerWidth;
    const sidebarWidth = document.querySelector("[data-sidebar]") 
      ? (document.querySelector("[data-sidebar]") as HTMLElement).offsetWidth 
      : 288;
    const { width, shouldCollapse } = clampPanelWidth({
      containerWidth,
      sidebarWidth,
      panelWidth,
    });
    if (shouldCollapse && panelOpen) {
      setPanelOpen(false);
      window.localStorage.setItem(PANEL_OPEN_KEY, "0");
    } else if (width !== panelWidth) {
      setPanelWidth(width);
      window.localStorage.setItem(PANEL_WIDTH_KEY, String(width));
    }
  };
  apply();
  window.addEventListener("resize", apply);
  return () => window.removeEventListener("resize", apply);
}, [panelOpen, panelWidth]);
```

Add `data-sidebar` on `Sidebar` root. Add `id="app-chat-shell"` on the flex row wrapping chat+panel in `app/page.tsx` or ChatWorkspace outer flex.

- [x] **Step 2: Media safety**

Ensure inline generated images in message list use `className` including `max-w-full h-auto` (artifact modal already has `w-full`).

- [x] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`  
Manual: open panel, shrink window ~900px — chat remains ≥ ~320px or panel collapses.

- [x] **Step 4: Commit**

```bash
git commit -am "fix(chat): reclamp right panel on window resize (wave A)"
```

---

### Task 3: Wave B — admin discovery UI

**Files:**
- Modify: `src/components/ProfileMenu.tsx` — use `isAdminSession` pattern (client: `session.user.isAdmin ||` keep; ensure JWT sets isAdmin)
- Modify: `src/components/Sidebar.tsx` — admin footer links
- Modify: `src/components/SettingsModal.tsx` — admin console link
- Modify: `src/components/landing/Header.tsx` — prefer checking email via session flag already set in jwt
- Verify: `src/auth.ts` jwt callback sets `token.isAdmin = isAdminEmail(email)`

**Interfaces:**
- Consumes: `isAdminEmail` / session `user.isAdmin`
- Produces: visible links `/admin`, `/admin/security` for admins only

- [x] **Step 1: Confirm JWT**

In `src/auth.ts` jwt callback, ensure:

```ts
token.isAdmin = isAdminEmail(token.email as string | undefined);
```

and session callback copies `session.user.isAdmin = !!token.isAdmin`.

- [x] **Step 2: Sidebar footer (admin only)**

```tsx
{isAdmin && (
  <div className="mt-auto space-y-1 border-t border-slate-800 p-2 text-sm">
    <Link href="/admin">{t("profile.adminPanel")}</Link>
    <Link href="/admin/security">{t("profile.securityPanel") /* add i18n */}</Link>
  </div>
)}
```

Add i18n keys `profile.securityPanel` in `src/lib/i18n.ts` / locale files used by `useT`.

- [x] **Step 3: SettingsModal General or footer**

When `session?.user?.isAdmin`, show button closing modal + `router.push("/admin")`.

- [x] **Step 4: Ops note in PR body**

Remind: set `ADMIN_EMAILS=zeff@zeffai.com` on Vercel.

- [x] **Step 5: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git commit -am "feat(admin): sidebar + settings discovery links (wave B)"
```

---

### Task 4: Wave C — Google complete-password path

**Files:**
- Modify: `src/auth.ts` (adapter linking)
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Create or modify: `src/app/api/auth/complete-password/route.ts`
- Modify: `src/app/api/auth/signup/route.ts` as needed

**Interfaces:**
- Produces: `POST /api/auth/complete-password` `{ password }` for authenticated Google user without `passwordHash`
- Produces: redirect rule after Google: no password → `/signup?from=google`

- [x] **Step 1: Auth.js same-email linking**

In Google provider config:

```ts
Google({
  allowDangerousEmailAccountLinking: true, // only safe because Google email is verified
  authorization: { params: { scope: "openid email profile" } },
}),
```

Document in comment: linking allowed only for verified Google emails.

- [x] **Step 2: Post-login gate**

Add middleware or client check on `/app`: if session user lacks password and `needsPasswordComplete` cookie/flag — prefer server redirect in a small `src/lib/authComplete.ts` called from `app/app/layout.tsx`:

```ts
export async function requirePasswordComplete() {
  const session = await auth();
  if (!session?.user?.id) return;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (user && !user.passwordHash) {
    redirect("/signup?from=google");
  }
}
```

Call from `src/app/app/layout.tsx` (and optionally skip for `/signup`).

- [x] **Step 3: Signup UI for `from=google`**

When `searchParams.from === "google"`:
- Prefill email read-only from session
- Hide OTP email step
- Collect password + confirm + terms
- `POST /api/auth/complete-password` with session cookie

```ts
// complete-password/route.ts sketch
const session = await auth();
if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
const hash = await bcrypt.hash(password, BCRYPT_COST);
await prisma.user.update({
  where: { id: session.user.id },
  data: { passwordHash: hash },
});
return NextResponse.json({ ok: true });
```

- [x] **Step 4: Login page**

Keep Google button; after OAuth, gate handles redirect. Add signup link copy for password setup.

- [x] **Step 5: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git commit -am "feat(auth): Google users complete Zeff password (wave C)"
```

---

### Task 5: Wave D — Settings Security Google link/unlink

**Files:**
- Create: `src/app/api/account/oauth/google/link/route.ts` (may be `signIn("google", { callbackUrl: "/app?settings=security" })` client-only)
- Create: `src/app/api/account/oauth/google/unlink/route.ts`
- Modify: `src/components/settings/SecurityPanel.tsx`
- Modify: settings API or add `GET` accounts status endpoint `src/app/api/account/auth-methods/route.ts`

**Interfaces:**
- Produces: `GET /api/account/auth-methods` → `{ hasPassword: boolean, google: { linked: boolean, email?: string } }`
- Produces: `POST /api/account/oauth/google/unlink` — deletes Google `Account` row only if `passwordHash` set

- [x] **Step 1: auth-methods route**

```ts
const session = await auth();
// prisma.user + accounts where provider === "google"
return NextResponse.json({ hasPassword: !!user.passwordHash, google: { linked, email } });
```

- [x] **Step 2: unlink route**

```ts
if (!user.passwordHash) {
  return NextResponse.json({ error: "password_required" }, { status: 400 });
}
await prisma.account.deleteMany({ where: { userId, provider: "google" } });
```

- [x] **Step 3: SecurityPanel UI**

Section “연결된 계정”:
- If !google.linked → button `signIn("google", { callbackUrl })`
- If linked → badge + unlink button (disabled with tooltip if !hasPassword)
- If !hasPassword → link to `/signup?from=google` or inline password form calling complete-password

- [x] **Step 4: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git commit -am "feat(settings): Google link/unlink in Security (wave D)"
```

---

### Task 6: Wave E — Settings General redesign

**Files:**
- Modify: `src/components/SettingsModal.tsx` (`GeneralPanel`)
- Modify: i18n keys under `settings.general.*`
- Sync theme with existing dark-mode toggle (find theme context / `document.documentElement.classList`)

**Interfaces:**
- Consumes: `useSettings`, session user, plan label if available
- Produces: denser General UI; theme preference in `localStorage` key e.g. `kx.theme` = `system|light|dark`

- [x] **Step 1: Implement GeneralPanel layout**

Structure:
1. Account hero row (avatar initials, name, email, plan chip)
2. Language select (existing)
3. Theme segmented control writing `kx.theme` and applying class
4. Quick actions: `router.push` new chat / library; admin if admin
5. Shortcut hint paragraph

Use frontend-design skill; no card spam; match app slate/blue tokens.

- [x] **Step 2: Theme sync**

On change, update the same mechanism ProfileMenu moon toggle uses (read that code and unify on one helper `src/lib/themePreference.ts` if duplicated).

- [x] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git commit -am "feat(settings): trendy General tab layout (wave E)"
```

---

### Task 7: Wave F — FeatureShowcase throttle for two features

**Files:**
- Modify: `src/components/landing/FeatureShowcase.tsx`
- Modify: `src/lib/landingI18n/ko.ts` (and en/ja as needed) for scene copy
- Reuse: `src/lib/landingScroll.ts` (`useScrollProgress`, `stickySceneIndex`, `sceneLocalProgress`)

**Interfaces:**
- Consumes: scroll helpers from `landingScroll.ts`
- Produces: sticky section `id="features"` with scenes for **문서·발표자료** and **공유 서재**

- [x] **Step 1: Refactor scenes array**

Keep only two throttle scenes (docs/PPT + library). Move AI 요약 / 강의 분석 to a compact static strip above or drop from throttle (Wave H places office strip separately).

- [x] **Step 2: Sticky height ~320vh**, sticky viewport, progress-driven opacity/transform — mirror patterns already in `WorkLectureScroll.tsx`.

- [x] **Step 3: reduced-motion media query** → two static full-width blocks.

- [x] **Step 4: Verify + commit**

```bash
npx tsc --noEmit && npm run lint
git commit -am "feat(landing): FeatureShowcase throttle for PPT + library (wave F)"
```

---

### Task 8: Wave G — SkillsSection throttle

**Files:**
- Modify: `src/components/landing/SkillsSection.tsx`
- Modify: landing i18n `skills.*`

**Interfaces:**
- Same scroll primitives as Task 7
- CTAs: `/design`, app/login hrefs unchanged

- [x] **Step 1: Replace card grid with sticky 3-scene throttle** (`id="skills"`, ~360vh).

Per scene: eyebrow optional (not overpowering brand), title, one sentence, text CTA — full-bleed visual background (gradient/image), **no cards**.

- [x] **Step 2: Keep post-throttle CTA band** to `/app` or login.

- [x] **Step 3: reduced-motion** → stacked sections without sticky scrubbing.

- [x] **Step 4: Verify + commit**

```bash
git commit -am "feat(landing): SkillsSection scroll throttle (wave G)"
```

---

### Task 9: Wave H — Landing IA reorder

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/landing/Header.tsx` nav hrefs
- Possibly slim `WorkspaceIntro.tsx` copy

**Target order:**

```tsx
<main>
  <Hero />
  <SkillsSection />      {/* G */}
  <FeatureShowcase />   {/* F — dynamic import */}
  <WorkLectureScroll /> {/* slim office strip — dynamic import */}
  <WorkspaceIntro />    {/* shortened */}
  <PricingLead />
  <Pricing />
</main>
```

- [x] **Step 1: Update `page.tsx` imports and order** as above.

- [x] **Step 2: Header anchors** → `#skills`, `#features`, `#pricing` matching section ids.

- [x] **Step 3: Shorten WorkspaceIntro** to one headline + one sentence + one CTA (no competing feature grid).

- [x] **Step 4: Verify + commit**

```bash
git commit -am "feat(landing): reorder IA Hero→Skills→Features→Office→Intro→Pricing (wave H)"
```

---

### Task 10: Wave I — Hero video + light 3D

**Files:**
- Create: `public/landing/hero-poster.jpg` (or `.webp`)
- Create: `public/landing/hero-loop.mp4` (placeholder atmosphere loop; document swap in PR)
- Create: `src/components/landing/LandingLight3D.tsx`
- Modify: `src/components/landing/Hero.tsx`

**Interfaces:**
- Hero mounts `<video muted loop playsInline poster=...>` behind content when motion OK
- `LandingLight3D` CSS 3D (prefer) floated in Skills scene 0 or Feature scene 0 via prop slot

- [x] **Step 1: Hero video layer**

```tsx
<video
  className="absolute inset-0 h-full w-full object-cover"
  autoPlay
  muted
  loop
  playsInline
  poster="/landing/hero-poster.jpg"
  aria-hidden
>
  <source src="/landing/hero-loop.mp4" type="video/mp4" />
</video>
```

Wrap with `useReducedMotion()` — if true, show poster `<img>` only.

- [x] **Step 2: LandingLight3D**

CSS perspective + rotating subtle plane (no three.js unless already depended). `IntersectionObserver` to pause animation offscreen.

- [x] **Step 3: Place 3D in one throttle scene** (Skills “콘텐츠 자동화”).

- [x] **Step 4: Verify + commit**

```bash
git add public/landing src/components/landing
git commit -m "feat(landing): hero video loop + light 3D accent (wave I)"
```

---

### Task 11: Plans index + PRD status + final verification

**Files:**
- Modify: `docs/PRD_APP_SHELL_AUTH_SETTINGS_2026-07.md` status → Implemented (when done)
- Modify: `docs/superpowers/specs/2026-07-28-app-shell-auth-settings-landing-design.md` status
- Create: `plans/024-app-shell-auth-landing.md` stub pointing to this superpowers plan (optional, match repo convention)
- Modify: `plans/README.md` rows 024+

- [x] **Step 1: Full verify**

```bash
npm run lint && npx tsc --noEmit && npm run eval:ai
```

Expected: exit 0 / all goldens pass.

- [x] **Step 2: Update docs statuses + plans README**

- [x] **Step 3: Push + update PR**

```bash
git push -u origin cursor/app-shell-auth-landing-a14a
```

---

## Spec coverage checklist (self-review)

| Spec wave | Tasks |
|-----------|-------|
| A layout | 1–2 |
| B admin | 3 |
| C Google password | 4 |
| D link/unlink | 5 |
| E General | 6 |
| F Feature throttle | 7 |
| G Skills throttle | 8 |
| H IA | 9 |
| I video/3D | 10 |
| Verify / docs | 11 |

No TBD placeholders. Types: `clampPanelWidth` return `{ width, shouldCollapse }` used in Task 2. Auth complete-password + auth-methods + unlink named consistently in Tasks 4–5.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-28-app-shell-auth-settings-landing.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — this session with executing-plans, batched checkpoints  

**Which approach?**
