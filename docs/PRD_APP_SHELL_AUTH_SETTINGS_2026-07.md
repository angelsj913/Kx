# PRD: App Shell · Auth Linking · Settings · Landing Throttle

| Field | Value |
|-------|--------|
| **Status** | Draft — awaiting owner approval of design spec |
| **Date** | 2026-07-28 |
| **Base** | `main` @ merge `03eaa6b` |
| **Full design spec** | [`docs/superpowers/specs/2026-07-28-app-shell-auth-settings-landing-design.md`](./superpowers/specs/2026-07-28-app-shell-auth-settings-landing-design.md) |
| **Process** | Superpowers brainstorming → spec review → writing-plans → implement |

---

## Defaults (approved)

| Decision | Choice |
|----------|--------|
| Packaging | **Single PRD**, waves **A → B → C+D → E → F** |
| Auth model | Same email: Google + Zeff password on **one User** |
| Landing throttle | FeatureShowcase **문서·발표자료** + **공유 서재** |
| Admin email | `zeff@zeffai.com` via **`ADMIN_EMAILS` env only** (no hardcode) |

---

## Waves (summary)

| Wave | Title | Success |
|------|-------|---------|
| **A** | Chat layout resize | Chat column keeps ≥ `CHAT_MIN`; panel reclamps / auto-collapses |
| **B** | Admin · security discovery | Allowlisted admin sees sidebar + profile + settings link; MFA unchanged |
| **C** | Google → signup complete | New Google users set password before normal app use |
| **D** | Settings · Security Google link | Link / unlink with password guards |
| **E** | Settings · General redesign | Hero + language + theme + quick actions + shortcuts |
| **F** | Landing throttle ×2 | Sticky scroll scenes for two features; reduced-motion fallback |

---

## Out of scope

- Hardcoded admin emails  
- MFA relaxation  
- Extra social IdPs  
- SkillsSection throttle / full landing IA rewrite  
- Large new settings backend surface  

---

## Approval gate

1. Owner reviews the **design spec** (link above).  
2. On approval → implementation plan via `writing-plans`.  
3. On plan approval → code on branch `cursor/…-a14a` with `/using-superpowers` workflow.

**Owner action:** reply **스펙 승인** (or list change requests).
