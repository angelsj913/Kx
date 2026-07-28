# PRD: Landing Motion & Unified Surface (2026-07)

| Field | Value |
|-------|--------|
| **Status** | Draft — 승인 대기 |
| **Branch** | `cursor/landing-motion-billing-a14a` |
| **Includes** | PR #60 6-month billing + PR #59 app-shell landing |
| **Design spec** | [`DESIGN.md`](../DESIGN.md) |
| **Advisor skills** | `design-motion-principles`, `animate`, `guardrail-design`, `trust-calibration`, `color-system`, `animation-principles` |

## 1. Problem

홈페이지가 스크롤 구간마다 배경색이 달라지고(`bg-soft`, scene gradient), Skills/Features/Work 섹션 사이에 **빈 띠**가 보인다. 6개월 요금제 변경과 스크롤 랜딩(히어로 영상, FeatureShowcase, WorkLectureScroll)이 한 브랜치에 합쳐지기 전에 **표면·모션·밀도**를 한 번 정리해야 한다.

## 2. Goals

1. **배경 단일화** — 전 페이지 `--landing-bg` 하나; 섹션 band 제거.
2. **스크롤 품질** — sticky scene 전환 280ms, reduced-motion 정적 폴백 유지, 허전한 뷰포트 없음.
3. **느낌 유지** — Noto + blue accent + 기존 카피/IA; “템플릿 갈아엎기” 아님.
4. **6개월 요금** — Pro $35 / Professional $50 (PR #60) 유지.
5. **DESIGN.md** — 에이전트·향후 수정의 단일 디자인 스펙.

## 3. Non-goals

- `/app` 워크스페이스 UI 리디자인
- Remotion 영상 파이프라인 (스킬은 로컬 참고용)
- 200+ codex 스킬 레포 커밋 (용량; 핵심 6개만 문서화)

## 4. Installed skills (local)

```bash
npx skills add kylezantos/design-motion-principles -y
npx skills add Owl-Listener/ai-design-skills --skill guardrail-design -y
npx skills add Owl-Listener/ai-design-skills --skill trust-calibration -y
npx skills add delphi-ai/animate-skill --skill animate -y
npx skills add LobzyJay/motion-design-with-claude -y
npx skills add Owl-Listener/designer-skills -y
# 참고용 대량 팩 (로컬만): ComposioHQ/awesome-codex-skills, remotion-dev/remotion
```

Playwright MCP (`claude mcp add playwright`) — Cursor Cloud에서는 별도 MCP 설정 필요; E2E는 수동/Preview.

## 5. Implementation waves (승인 절차)

### Wave A — Foundation ✅ (이 PR에서 구현)

- [x] `DESIGN.md` 작성
- [x] `globals.css` 단일 배경 + motion tokens + `.landing-section-rule`
- [x] Scene 배경 opaque gradient → transparent + accent radial
- [x] `bg-[var(--landing-bg-soft)]` band 섹션 제거

### Wave B — Scroll density (이 PR에서 구현)

- [x] FeatureShowcase / SkillsSection / WorkLectureScroll sticky 높이·패딩 조정
- [x] WorkspaceIntro: 3-column capability grid + CTA (허전함 제거)
- [x] PricingLead: stagger fade-in (reduced-motion off)

### Wave C — Optional polish (승인 후)

- [ ] `WhyZeff` 섹션 Hero 아래 재배치 (A/B)
- [ ] Hero `LandingLight3D` intensity 튜닝
- [ ] Lottie/Remotion 루프 에셋 (성능 검증 후)

### Wave D — Merge & ship (승인 후)

- [ ] PR #60 + 본 PR → `main` 병합
- [ ] Vercel Production 배포
- [ ] Paymentwall `pro_6month` / `professional_6month` 라이브 테스트

## 6. Acceptance criteria

| # | Criterion |
|---|-----------|
| AC1 | 라이트/다크 모두 스크롤 시 배경색이 **한 톤**으로 보임 |
| AC2 | `#skills`, `#features` sticky scene이 100svh를 채우고 카피+목업 동시 노출 |
| AC3 | `prefers-reduced-motion` 시 정적 레이아웃, 동일 카피 |
| AC4 | Pricing Pro $35/6mo, Professional $50/6mo |
| AC5 | `npm run lint` + `npx tsc --noEmit` 통과 |

## 7. 승인 방법

답장 예시:

- **`A`** — Wave A+B만 머지 (권장 기본)
- **`A+C`** — Wave C까지 포함 구현 후 머지
- **`수정: …`** — PRD 수정 요청

---

*Spec companion: `docs/superpowers/specs/2026-07-28-landing-motion-design.md`*
