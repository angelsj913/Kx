# PRD: App Shell · Auth Linking · Settings · Landing Experience

| Field | Value |
|-------|--------|
| **Status** | **Implemented / Done** — branch `cursor/app-shell-auth-landing-a14a`, waves A–I shipped |
| **Date** | 2026-07-28 |
| **Base** | `main` @ merge `03eaa6b` |
| **Full design spec** | [`docs/superpowers/specs/2026-07-28-app-shell-auth-settings-landing-design.md`](./superpowers/specs/2026-07-28-app-shell-auth-settings-landing-design.md) |
| **Process** | Superpowers brainstorming → spec review → writing-plans → implement |

---

## Defaults (approved)

| Decision | Choice |
|----------|--------|
| Packaging | **Single PRD**, waves **A → B → C+D → E → F → G → H → I** |
| Auth model | Same email: Google + Zeff password on **one User** |
| Feature throttle | **문서·발표자료** + **공유 서재** |
| Skills throttle | SkillsSection **3 skills** (스크롤 스토리) |
| Landing IA | Full reorder (Hero → Skills → Features → office strip → WorkspaceIntro → Pricing) |
| Media | Hero **video loop** + **light 3D** accent on one scene |
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
| **F** | FeatureShowcase throttle ×2 | Sticky scenes for 문서·발표 + 서재 |
| **G** | SkillsSection throttle ×3 | Sticky scenes for three skills |
| **H** | Landing IA reorder | New section order + anchors; mount F/G |
| **I** | Video + light 3D | Hero loop video; one decorative 3D layer; reduced-motion safe |

---

## Out of scope

- Hardcoded admin emails  
- MFA relaxation  
- Extra social IdPs  
- Live Higgsfield generation API  
- Heavy WebGL product configurator / custom 3D engine  
- In-agent brand film production (replaceable `public/landing` assets)  
- Large new settings backend surface  

---

## Approval gate

1. Owner reviews the **design spec** (link above).  
2. On approval → implementation plan via `writing-plans`.  
3. On plan approval → code with `/using-superpowers` workflow.

**Owner action:** Spec approved. Choose plan execution mode (subagent-driven vs inline), then implement.
