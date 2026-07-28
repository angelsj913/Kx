# Design Spec: App Shell, Auth Linking, Settings & Landing Experience

| Field | Value |
|-------|--------|
| **Status** | Awaiting user review (revised — landing scope expanded) |
| **Date** | 2026-07-28 |
| **Planned at** | `main` @ `03eaa6b` |
| **Approach** | Single PRD, waves **A → B → C+D → E → F → G → H → I** |
| **PRD twin** | [`docs/PRD_APP_SHELL_AUTH_SETTINGS_2026-07.md`](../../PRD_APP_SHELL_AUTH_SETTINGS_2026-07.md) |
| **Revision** | Owner added: new video/3D, SkillsSection throttle, full landing IA reorder |

---

## 1. Problem summary

| ID | Symptom | Root cause (current code) |
|----|---------|---------------------------|
| A | Narrowing the browser collapses the center chat | Left sidebar + right panel are `shrink-0`; chat is `flex-1 min-w-0`; panel width not re-clamped on window `resize` |
| B | Admin / security entry looks “gone” | UI gated on `session.user.isAdmin`; discovery only in ProfileMenu + landing Header; security behind `/admin/security` + MFA |
| C | Google login skips Zeff password account | Google → Auth.js session directly; no `/signup` complete step for password |
| D | No Google link/unlink in user Settings → Security | `SecurityPanel` has password/2FA only |
| E | Settings → General feels empty | `GeneralPanel` is language select only |
| F | Feature storytelling weak for core library/PPT | FeatureShowcase throttle not applied to **문서·발표자료** + **공유 서재**; component may be off the live page |
| G | SkillsSection is a static 3-card grid | No scroll-progress storytelling for 콘텐츠 자동화 / STEM / 지능형 리포트 |
| H | Landing IA is flat and incomplete | Live `page.tsx` is Hero → WorkspaceIntro → Skills → Pricing only; FeatureShowcase / WorkLectureScroll not in the tree; hierarchy unclear |
| I | Hero/feature media lacks presence | No dedicated motion video / light 3D plane on landing |

---

## 2. Goals & non-goals

**Goals**

- Preserve readable chat column (`CHAT_MIN` ≥ 320px) under resize.
- Make admin + security entry discoverable for allowlisted admins (`zeff@zeffai.com` via `ADMIN_EMAILS`, never hardcoded).
- One User per email: Google OAuth + credentials both work after password completion.
- Settings → Security: link/unlink Google with safe guards.
- Settings → General: dense, trendy layout without feature bloat.
- Landing: throttle for FeatureShowcase targets **and** SkillsSection; **reorder full landing IA**; add **hero/feature video + light 3D** presence.

**Non-goals**

- Hardcoding admin emails in source.
- Relaxing admin MFA for `/admin/security`.
- Additional IdPs (Apple, etc.).
- Custom theme color pickers / notification center.
- Live Higgsfield Instagram generation API (marketing `/design` only).
- Heavy real-time WebGL product configurator or custom 3D engine beyond a light decorative layer.
- Filming new brand shoots in-agent — use stock/placeholder MP4 + replaceable `public/` assets (owner may swap files later).

---

## 3. Decisions (approved in brainstorming + revision)

| Topic | Decision |
|-------|----------|
| Delivery | Single PRD, waves **A → B → C+D → E → F → G → H → I** |
| Account model | Same email: add password to Google user (one User, two auth methods) |
| Feature throttle | FeatureShowcase: **문서·발표자료** + **공유 서재** |
| Skills throttle | SkillsSection: all **3** skills (콘텐츠 자동화 · STEM · 지능형 리포트) |
| Landing IA | Full reorder (see Wave H) |
| Media | New loop video on hero (full-bleed) + light 3D/CSS-3D accent on one throttle scene |
| Defaults (agent-owned) | Admin discovery in sidebar + settings link; General = hero + language + display + quick actions + shortcuts; panel auto-collapse when `CHAT_MIN` cannot fit |

---

## 4. Wave designs

### Wave A — Chat layout resize

**Files (primary):** `src/app/app/page.tsx`, `src/components/ChatWorkspace.tsx`, `src/components/ChatRightPanel.tsx`, `src/components/Sidebar.tsx`

**Behavior**

1. On mount and `window.resize`, recompute  
   `maxPanel = containerWidth − sidebarWidth − CHAT_MIN − gutter`  
   and clamp stored `panelWidth` into `[PANEL_MIN, min(PANEL_MAX, maxPanel)]`.
2. If `maxPanel < PANEL_MIN`, auto-close the panel to the rail (desktop). Persist closed state consistently with existing open/close.
3. Keep drag-resize logic; after drag, write clamped value to `localStorage`.
4. Ensure message/media containers use `min-w-0` and images `max-w-full` so content does not force horizontal crush.

**Acceptance**

- At ~900px viewport width, chat bubbles and generated images remain usable; panel does not consume the chat column.

---

### Wave B — Admin & security discovery

**Files (primary):** `src/lib/admin.ts`, `src/components/ProfileMenu.tsx`, `src/components/Sidebar.tsx`, `src/components/SettingsModal.tsx`, `src/components/landing/Header.tsx`, `src/auth.ts` (session `isAdmin` consistency)

**Behavior**

1. Unify visibility checks on `isAdminSession(session)` (JWT flag **or** `isAdminEmail`), not `isAdmin === true` alone.
2. Admin-only sidebar footer links: **관리자** → `/admin`, **보안** → `/admin/security` (existing MFA redirect to `/admin/verify` unchanged).
3. Settings modal: admin-only text link “관리자 콘솔” → close modal, navigate `/admin`.
4. Keep ProfileMenu + landing Header links.
5. Ops checklist: verify Vercel `ADMIN_EMAILS` includes `zeff@zeffai.com`. No source hardcode.

**Acceptance**

- Admin user sees sidebar + profile entries; non-admin never sees them. Security still requires MFA.

---

### Wave C+D — Google ↔ Zeff credentials (same email)

**Files (primary):** `src/auth.ts`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/api/auth/signup/route.ts`, new complete-password / link APIs as needed, `src/components/settings/SecurityPanel.tsx`, Prisma `Account` / `User` usage

**Account model**

- One `User` row per email.
- Google OAuth account row + optional `passwordHash` for credentials.

**C — Google complete signup**

1. After Google OAuth:
   - If `passwordHash` present → `callbackUrl` (default `/app`).
   - Else → `/signup?from=google` (session kept or short-lived completion token).
2. `/signup?from=google`: email read-only from Google; password + confirm + terms; write `passwordHash` on same user; then `/app`.
3. Email OTP signup unchanged; add “Google로 계속” with same completion rules.
4. Enable safe same-email linking for verified Google only (`allowDangerousEmailAccountLinking` only with verified-email guard, or explicit link API). Never merge different emails.

**D — Settings → Security**

| State | UI |
|-------|-----|
| Google not linked | “Google 계정 연동” → OAuth link |
| Google linked | Badge + email + unlink **only if** `passwordHash` exists |
| No password | “Zeff 비밀번호 설정” (same API as C) |

**Edge cases**

- Credentials login without password → copy pointing to password setup.
- Unlink blocked without password.
- Existing password account + Google with same email → link, do not create duplicate user / do not hijack.

**Acceptance**

- New Google user sets password once, then both Google and email/password login work; Settings can link/unlink with guards.

---

### Wave E — Settings → General redesign

**Files (primary):** `src/components/SettingsModal.tsx` (`GeneralPanel`), i18n keys, existing theme toggle wiring (`ProfileMenu` / theme provider)

**Layout (top → bottom)**

1. Account hero: avatar, name, email, plan badge (read-only summary).
2. Language (existing control, tighter section chrome — not an empty card grid).
3. Display: theme system / light / dark synced with existing moon toggle; optional chat density (client `localStorage` only).
4. Quick actions: new chat, library, admin (if admin) — link row, not card spam.
5. Shortcut hints (desktop): 2–3 lines.

**Design constraints**

- Follow app tokens; avoid purple-on-white, cream+serif terracotta, broadsheet clichés.
- Implementation uses frontend-design skill; 2–3 subtle motions max (section enter).

**Acceptance**

- General tab no longer looks empty; language + theme work and stay in sync with header toggle.

---

### Wave F — FeatureShowcase throttle (two features)

**Files (primary):** `src/components/landing/FeatureShowcase.tsx`, `src/lib/landingScroll.ts`, `src/lib/landingI18n/*`

**Targets:** **문서·발표자료**, **공유 서재**

**Behavior**

1. Throttle sticky track (`~300–360vh`) for the two targets using existing `useScrollProgress` / RAF lerp.
2. AI 요약 · 강의 분석: short static or minimal sticky strip (not full throttle), or fold into IA as secondary — Wave H decides final placement.
3. One headline + one sentence + full-bleed visual per scene.
4. `prefers-reduced-motion` → static two-card fallback.

**Acceptance**

- Scrolling the two features advances scenes; reduced-motion and mobile remain readable.

---

### Wave G — SkillsSection throttle

**Files (primary):** `src/components/landing/SkillsSection.tsx`, `src/lib/landingScroll.ts`, i18n `skills.*`

**Targets:** 콘텐츠 자동화 (`/design`) · STEM · 지능형 리포트 (all three)

**Behavior**

1. Replace static 3-column card grid with sticky scroll-progress scenes (same scroll primitive as FeatureShowcase / WorkLectureScroll).
2. Per skill: brand-safe headline, one supporting sentence, one CTA (existing hrefs), full-bleed visual plane — **no cards in the hero-like sticky frame**.
3. CTA band to `/app` or login retained after the throttle block (or as final scene).
4. `prefers-reduced-motion` → static stacked sections (not a card grid of chrome for chrome’s sake).

**Acceptance**

- All three skills animate through scroll scenes; links still work; reduced-motion fallback readable.

---

### Wave H — Full landing IA reorder

**Files (primary):** `src/app/page.tsx`, landing section components, header anchor links / `landingI18n` nav if needed

**Current live tree:** Header → Hero → WorkspaceIntro → SkillsSection → PricingLead → Pricing → Footer  
(`FeatureShowcase` / `WorkLectureScroll` not mounted.)

**Target IA (top → bottom)**

1. **Hero** — brand-first; one H1; one sentence; one CTA group; **full-bleed video** (Wave I). No stats/schedules/cards in first viewport.
2. **Skills throttle** (Wave G) — three core skills.
3. **Feature throttle** (Wave F) — 문서·발표자료 + 공유 서재.
4. **Proof / office strip** — slim reuse of WorkLectureScroll **or** a single compressed “office tools” band (PPT · 엑셀 · 강의) so prior investment is not orphaned; if too long, keep reduced-motion static trio only.
5. **WorkspaceIntro** — shortened to one job (workspace promise), demoted below product stories.
6. **PricingLead → Pricing**.
7. **Footer**.

**Nav anchors** update to match (`#skills`, `#features`, `#pricing`, etc.).

**Acceptance**

- First viewport passes brand test; section order matches table; no duplicate “same throttle screen” feeling between F and G (different copy/visual jobs).

---

### Wave I — New video + light 3D

**Files (primary):** `src/components/landing/Hero.tsx`, optional `LandingMedia3D.tsx`, assets under `public/landing/`

**Video**

- Hero background: muted autoplay loop (`video` + poster image), `preload="metadata"`, respect `prefers-reduced-motion` (show poster only).
- Ship with a replaceable asset path (`public/landing/hero-loop.mp4` + poster). If no final brand file yet, use a high-quality abstract/product-atmosphere placeholder and document swap instructions in the PRD.

**Light 3D**

- One decorative layer on a throttle scene (prefer Skills “콘텐츠 자동화” or Feature “문서·발표자료”): CSS 3D transform stack **or** a tiny r3f/three canvas with ≤1 floating object, no physics, pause when offscreen / reduced-motion.
- Must not block LCP: lazy-mount below fold; hero video is the primary motion budget.

**Acceptance**

- Hero video plays on desktop/mobile with poster fallback; 3D accent visible on one scene without jank; reduced-motion disables both motion layers.

---

## 5. Architecture sketch

```
Wave A: app shell flex clamp ──┐
Wave B: isAdminSession + nav ──┼─► ship first (app)
Wave C: auth callbacks + signup complete ─┐
Wave D: SecurityPanel link/unlink ────────┴─► same User model
Wave E: GeneralPanel UI
Wave H: page.tsx IA order ──┐
Wave F: FeatureShowcase    ─┼─► landing package (H wires F/G/I)
Wave G: SkillsSection      ─┤
Wave I: video + light 3D   ─┘
```

Landing waves **H wires F/G/I**; implement F/G components then mount via H, with I assets in Hero + one scene.

---

## 6. Verification baseline

| Check | Command / action |
|-------|------------------|
| Lint | `npm run lint` |
| Types | `npx tsc --noEmit` |
| Eval | `npm run eval:ai` (no regressions) |
| Manual A | Resize desktop ~900px with panel open |
| Manual B | Login as allowlisted admin; sidebar links; MFA still gates security |
| Manual C/D | Google new user → password → both logins; link/unlink guards |
| Manual E | General tab filled; theme sync |
| Manual F/G | Scroll feature + skills throttles; reduced-motion fallback |
| Manual H | Section order matches IA; anchors work |
| Manual I | Hero video + one 3D accent; reduced-motion posters only |

---

## 7. Implementation plan handoff

After **user approves this written spec**, invoke `writing-plans` to produce:

`docs/superpowers/plans/2026-07-28-app-shell-auth-settings-landing.md`

Executable bite-sized tasks per wave (024+ under `plans/` if repo convention preferred).

**Do not start coding until the user explicitly approves this spec file.**
