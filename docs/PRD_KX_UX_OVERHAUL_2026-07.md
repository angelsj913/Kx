# PRD: Kx( ZEFF AI ) 홈페이지·워크스페이스 UX 전면 개편

| Field | Value |
|-------|--------|
| **Status** | 초안 (승인 대기) |
| **Author** | Product / Cloud Agent |
| **Date** | 2026-07-27 |
| **Base branch** | `main` |
| **선행 작업** | 커밋 `06c604a` 스킬 팩 설치 롤백 (별도 PR) |
| **디자인 스킬** | `nothing-design`, `frontend-design` |
| **리서치 스킬** | `deep-research` (법률·약관) |
| **개발 프로세스** | `using-superpowers`, `brainstorming`, `writing-plans` |

---

## 0. 사용자 의도 요약 (Understanding Check)

사용자는 **Kx( ZEFF AI )의 첫인상(홈페이지)과 핵심 사용 경험(워크스pace 채팅)** 을 “AI가 만든 티가 나는 SaaS”에서 **사람이 직접 만든 제품**처럼 느껴지도록 바꾸고, 동시에 **기능 오류·UX 마찰·법적 문서·검열·RAG 품질**을 한 번에 정리하려 합니다.

핵심 의도는 다음 6가지로 묶입니다.

1. **브랜드·디자인 재정립** — Nothing 디자인 언어 + frontend-design 원칙으로 홈페이지를 재기획. 스크롤 데모(스로틀) 섹션은 서로 다른 연출, 햄버거/헤더 색 불일치 제거, 푸터 정보 구조 정리.
2. **콘텐츠 휴머나이즈** — 홈·워크스페이스·회사 소개(소개/발전 가능성/프로토타입) 문구를 AI 티 없이 자연스럽게. `/humanizer` 스킬 원칙 적용(프로젝트에 미설치 시 copy-editing 워크플로우로 대체).
3. **다운로드 UX 숨김** — Windows/Mac/Android 다운로드 **버튼·설명 UI는 제거**하되 **다운로드 관련 코드·URL·모달 로직은 유지**(향후 재활성화).
4. **워크스페이스 품질** — 채팅바/퀵툴 UX 고도화, 로딩 문구 위치, AI 프로필 로고(다크/라이트), 답변 액션 아이콘화, 품질 프리셋(낮음/중간/높음), RAG+웹 검색, PPT/문서 생성 품질, AI 검열.
5. **버그·접근성 수정** — 관리자 패널 진입 불가, 뒤로가기가 이전 메뉴로만 가는 문제, PPT 의도 오탐, 에이전트 placeholder에 삭제된 기능 언급, 멀티툴 이미지 생성 오류(별도 승인 후).
6. **법률·컴플라이언스** — deep-research로 이용약관·개인정보처리방침·국제 이용 조항 등을 실제 ZEFF AI 운영( SaaS, OAuth, 클라우드 DB/Blob, 결제, 다국어 )에 맞게 정밀 보강.

**명시적 제외(별도 승인 후 PRD):** 멀티툴 이미지 생성 품질 개선 — 이번 PRD에는 계획만 기록, 구현 착수 전 사용자 승인 필요.

**선행 롤백:** `06c604a076bff44553a1f9cba02681a52a7f1bd4` (`feat(skills): install external agent skill packs`) — `.agents/skills/` 112개 스킬 번들은 **앱 런타임과 무관**하며 레포 용량·노이즈를 만든다. 사용자 요청에 따라 **revert PR**을 Phase 0으로 분리.

---

## 1. Executive Summary

**One-liner:** ZEFF AI 홈페이지를 Nothing-inspired 디자인으로 재기획하고, 워크스페이스 채팅·RAG·문서 생성·검열·법률 문서를 “프로덕션 SaaS” 수준으로 끌어올린다.

**성공 기준 (측정 가능):**

| 영역 | 지표 |
|------|------|
| 홈페이지 | 스크롤 섹션 3종 이상 시각적 차별화, 헤더/드로어 색 일치, 푸터 링크 재배치 완료 |
| 내비게이션 | 모든 랜딩 하위 페이지 뒤로가기 → `/` (히어로) 도달률 100% |
| 관리자 | `ADMIN_EMAILS` 등록 계정이 3클릭 이내 `/admin` 진입 |
| 채팅 | “PPT 무슨 AI?” 질문 시 tool 오탐 0%, RAG 무관 인용(여권법 등) 유사 케이스 80%↓ |
| 법률 | placeholder `[사업자 소재지]` 등 0건, 필수 조항(위탁·국외이전·미성년·해지) 반영 |
| 검열 | 테스트 프롬프트 20건 중 민감 주제 차단/완화 응답 100% |

---

## 2. Phase 0 — 선행 정리

### 2.1 커밋 `06c604a` 롤백

| 항목 | 내용 |
|------|------|
| **작업** | `git revert 06c604a` 또는 PR #56 close + revert |
| **범위** | `.agents/skills/`, `skills-lock.json`, `.cursor/skills/` symlink, `.claude/skills/`, `agent/skills/`, `data/skills/` |
| **유지** | Cursor 글로벌/캐시 스킬은 로컬 개발 환경에 남을 수 있음 — 레포에서만 제거 |
| **리스크** | 없음 (앱 빌드·런타임 무관) |

### 2.2 `/humanizer` 스킬

프로젝트에 `humanizer` 스킬 **미설치**. Phase 1에서 다음 중 택1:

- **A.** `coreyhaines31/marketingskills`의 `copy-editing` + 수동 휴머나이즈 체크리스트
- **B.** 외부 humanizer 스킬 저장소 조사 후 `npx skills add` (레포 커밋 여부는 별도 결정)

휴머나이즈 원칙: AI 클리셰 제거, 문장 길이 다양화, 구체적 동사, “저희는 ~지향합니다” 남발 금지, 숫자·행동 중심.

---

## 3. Phase 1 — 홈페이지 디자인 개편 (nothing-design + frontend-design)

### 3.1 디자인 방향 (Nothing-inspired for ZEFF AI)

**주제:** AI 워크스페이스 — “잡음 속 핵심(Zeff)”  
**청중:** 학생·직장인, 한국어 우선, 글로벌 랜딩 i18n 유지  
**페이지 단일 목표:** 웹 앱(`/app`) 시작 또는 제품 이해

**토큰 (초안 — `references/tokens.md` 기준 조정):**

| 역할 | Light | Dark |
|------|-------|------|
| 배경 | `#F5F3EE` (warm off-white) | `#0A0A0A` (OLED black) |
| Primary text | `#1A1A1A` | `#F0F0F0` |
| Secondary | `#6B6B6B` | `#888888` |
| Accent (이벤트) | `#D71921` (Nothing red, CTA 1곳만) | 동일 |
| Surface | `#FFFFFF` | `#141414` |

**타이포:** Space Grotesk (본문) + Space Mono (라벨/메타, ALL CAPS) + Doto (히어로 숫자/키 메트릭 1회)

**시그니처:** 히어로에 **단 하나의 대형 데이터 포인트** (예: “문서 3종 · 채팅 1곳 · 서재 ∞”) — 일반 그radient hero 금지.

**Google Fonts 로드 (선언 필수):**

```html
Space+Grotesk:wght@300;400;500;700
Space+Mono:wght@400;700
Doto:wght@700
```

### 3.2 홈페이지 IA (개편 후)

```
Header (fixed, transparent → scroll glass)
├── Hero ( thesis: Zeff = 핵심만 남기는 AI )
├── WorkspaceIntro (데모 영상 — 수학 풀이 1종)
├── WorkLectureScroll (3 scene — PPT / Excel / Lecture 각각 고유 mock )
├── FeatureGrid (6 cards — 서재 홍보 슬롯 추가 )
├── WhyZeff
├── FeatureShowcase (4 scene — AI요약/강의/문서/서재 각각 다른 레이아웃 )
├── PricingLead + Pricing
Footer (링크 우측 정렬 — §3.3)
```

### 3.3 푸터 재배치

**현재:** 좌측 nav(지원·약관·개인정보·1:1문의) | 우측 대표·이메일  
**목표:** 우측 블록 상단에 nav, 하단에 대표·이메일

```
┌─────────────────────────────────────────────┐
│  [워터마크 로고 — 중앙, opacity 7%]          │
│                    지원 · 이용약관 · 개인정보 · 1:1문의 │
│                    ZEFF AI · 문의 email · 대표 이름    │
└─────────────────────────────────────────────┘
```

**파일:** `src/components/landing/Footer.tsx`

### 3.4 다운로드 UX 숨김 (코드 유지)

| UI 제거 | 코드 유지 |
|---------|-----------|
| `Hero.tsx` Windows/Mac/Android CTA 버튼·모달 트리거 | `constants.ts` URL, modal 컴포넌트, `/download` 페이지 |
| Hero/랜딩 i18n의 다운로드 설명 문구 | `DownloadCta.tsx` 파일 자체 |
| Header 햄버거 `/download` 메뉴 항목 (선택) | Electron 빌드 스크립트 |

**구현:** `NEXT_PUBLIC_SHOW_DOWNLOAD_CTA=0` feature flag 또는 `Hero`에서 CTA 블록 조건부 렌더 `false` (default off).

### 3.5 햄버거 메뉴 ↔ 헤더 색 일치

**문제:** 메뉴 열림 시 드로어 배경(`bg-white` / `dark:bg-slate-900`)과 헤더(`transparent` 또는 `bg-white/70`) 불일치.

**해결:**

```tsx
// Header.tsx — menuOpen && scrolled 상태 통합
className={menuOpen
  ? "border-slate-900/[0.06] bg-white dark:bg-slate-950 dark:border-white/[0.08]"
  : scrolled ? "..." : "border-transparent bg-transparent"}
```

드로어 패널과 헤더에 **동일 surface 토큰** `--landing-surface-header` 적용.

### 3.6 스크롤 데모(스로틀) 섹션 차별화

**문제:** `WorkLectureScroll`(3 scene)과 `FeatureShowcase`(4 scene)가 유사한 sticky+track 패턴·mock UI.

**목표:** 각 scene마다 **다른 시각 언어**

| 섹션 | Scene | 연출 (nothing-design) |
|------|-------|------------------------|
| WorkLectureScroll | PPT | Dot-matrix 제목 + slide thumb grid (orange accent 1px) |
| | Excel | Space Mono 숫자 테이블 + bar sparkline |
| | Lecture | 단일 column transcript, line numbers |
| FeatureShowcase | AI요약 | 좌: PDF icon stack / 우: bullet 3줄 |
| | 강의분석 | waveform strip + timestamp mono |
| | 문서 | file tabs (docx/pptx/xlsx) horizontal |
| | **서재** (신규/강화) | library shelf + Book Chat bubble |

**파일:** `WorkLectureScroll.tsx`, `FeatureShowcase.tsx`, `landingScroll.ts` (scene easing 분리)

**서재 홍보:** FeatureGrid 또는 FeatureShowcase 04번을 **서재·RAG·Book Chat** 중심으로 교체. 중복 설명(“로컬 히스토리” 등) 삭제.

### 3.7 회사 페이지 휴머나이즈

**대상 키:** `company.about.*`, `company.vision.*`, `company.prototype.*` (+ en/ja 등 8개 locale)

**원칙:** Zeff 화학 비유·팀 스토리 **틀 유지**, “저희는 ~지향합니다” 반복·과장 형용사 제거, 짧은 문장 혼합.

**예시 방향 (ko, 초안):**

- about body2: “자료가 쌓일수록 중요한 줄은 더 묻힙니다. Zeff는 그 위에 덮인 잡음을 걷고, 지금 필요한 핵심만 남깁니다.”
- vision: 로드맵 톤 → “지금은 문서와 학습에서 시작했고, 다음은 팀이 같은 서재를 쓰는 경험입니다.”
- prototype: bullet을 **출시 상태**와 분리 (“실험 중 · 형태는 바뀔 수 있음”)

### 3.8 뒤로가기 → 홈 히어로

**문제:** `BackButton`이 `router.back()` → `/about` → `/vision` 탭 이동 시 history stack으로 이전 메뉴만 감.

**해결 (전역):**

| 페이지 | 변경 |
|--------|------|
| `CompanyPageContent` | `forceFallback={true} fallbackHref="/"` |
| `/download`, `/about`, `/vision`, `/prototype` | 동일 |
| `/support/*` | 이미 forceFallback — 유지 |
| Header 햄버거 | 닫을 때 history 변경 없음 (OK) |

**추가:** 회사 탭(`/about`↔`/vision`)은 **Link 네비** 유지, **뒤로가기 버튼만** 홈 고정.

**파일:** `BackButton.tsx` 사용처, `CompanyPageContent.tsx`

---

## 4. Phase 2 — 관리자 패널 접근 UX

### 4.1 현상

- 코드: `/admin`, `isAdminSession`, 헤더 wrench 버튼 존재
- UX gap: 모바일에서 아이콘만·햄버거에 없음, `ADMIN_EMAILS` 미설정 시 아무도 admin 불가, `AdminDeniedBanner` 쿼리 미연동

### 4.2 요구사항

| ID | 요구 | 우선순위 |
|----|------|----------|
| ADM-1 | 햄버거 메뉴 하단에 **관리자** 항목 (`session.user.isAdmin`) | P0 |
| ADM-2 | `/app` ProfileMenu·설정에 admin 링크 재확인 | P0 |
| ADM-3 | `ADMIN_EMAILS` empty 시 빌드/런타임 경고 + docs | P1 |
| ADM-4 | `requireAdminPage` deny → `/?admin=denied` redirect + `AdminDeniedBanner` | P1 |
| ADM-5 | Security MFA gate 안내 copy (verify 페이지) | P2 |

---

## 5. Phase 3 — 워크스페이스 채팅 UX (superpowers 기반)

### 5.1 채팅바 + 퀵툴 고도화 계획

**brainstorming 산출 — 컴포넌트 목표:**

```
┌──────────────────────────────────────────────────┐
│ [chip: agent ×]  [chip: ppt ×]                    │  ← active tools
├──────────────────────────────────────────────────┤
│ (+) (📖서재) (📎)  │  textarea                    │  ← unified toolbar
│                    │  placeholder (contextual)   │
├──────────────────────────────────────────────────┤
│ 품질 [ 낮음 | ●중간 | 높음 ]     [전송]           │  ← NEW quality preset
└──────────────────────────────────────────────────┘
```

**using-superpowers / writing-plans 체크리스트:**

1. `ChatWorkspace.tsx` 입력 영역 컴포넌트 분리 (`ChatComposer.tsx`)
2. 품질 프리셋 → `localStorage` + API `qualityTier` query param
3. Placeholder: tool별 `toolPlaceholders.ts` 단일 소스, **삭제된 기능 문자열 grep CI**
4. 서재(📖) 버튼: library quick attach / RAG index 상태 badge
5. (+) 메뉴: 카테고리 accordion, 최근 사용 3개 pin
6. 접근성: 키보드 `/` focus, Esc chip clear

### 5.2 로딩 UI

| 현재 | 목표 |
|------|------|
| textarea 위 `모델 시도 중...` | 스트리밍 버블 옆 **회전 Logo + status 텍스트** 한 줄 |
| 메시지 영역 Logo spin only | 유지 + status를 bubble header에 inline |

**i18n:** `status.route.generate.try` → bubble inline

### 5.3 AI 프로필 이미지

| | |
|-|-|
| 현재 | Sparkles gradient circle |
| 목표 | `Logo` 컴포넌트 `size="sm"`, `dark:` `/logo-zeff-dark.png`, light: `/logo-zeff.png` |

**파일:** `ChatWorkspace.tsx`, `Logo.tsx`

### 5.4 답변 하단 액션 — 아이콘 only

버튼: 복사, TXT, PDF, 재생성, 좋아요, 아쉬워요, 다운로드

- `aria-label` + `title` 유지
- 텍스트 span 제거
- `gap-1`, `h-8 w-8`, tooltip on hover

**파일:** `ChatWorkspace.tsx`, `ModelFeedback.tsx`, `FileResultPanel.tsx`

### 5.5 AI 품질 설정 (낮음 / 중간 / 높음)

| Tier | 모델 | maxTokens | RAG topK | Verify |
|------|------|-----------|----------|--------|
| 낮음 | flash-lite 계열 | 1024 | 2 | off |
| 중간 | default | 4096 | 4 | light |
| 높음 | pro 계열 | 8192 | 8 | deep |

**API:** `src/lib/backendRoute.ts`, `usage.ts` quota multiplier (높음 = 2× credit)

### 5.6 에이전트 placeholder 정리

**삭제 대상 예:** “우리 서재에서 A를 찾아 요약하고, 그걸로 **발표 자료** 만들어줘” (발표자료 퀵툴 삭제됨)

**검사:** `grep -r "발표 자료\|presentation material\|서재에서.*만들" src/lib tools.ts i18n.ts`

**대체 placeholder:** “예) 업로드한 PDF 핵심만 요약해줘” / “예) 서재 문서 기준으로 ○○ 비교해줘”

### 5.7 PPT 의도 오탐 수정

**버그:** “ppt 생성은 **무슨 ai**로 하나요” → `detectQuickToolFromText`가 `ppt` 키워드만 보고 tool 실행 → 빈 슬라이드 에러

**수정:** `intentTools.ts`에 **meta/question 패턴 제외**

```ts
const isMetaQuestion = /무슨\s*ai|어떤\s*ai|what\s+ai|which\s+model|어떻게\s*작동/i.test(t);
if (isMetaQuestion && !/(만들|생성|작성|해\s*줘)/i.test(t)) return null;
```

**추가:** informational intent → `runBackendRoute` free chat + product FAQ context

---

## 6. Phase 4 — RAG · 웹 검색 · 인용 품질

### 6.1 현상 (스크린샷)

질문: 흉기 관련 법  
인용: 여권법 법정대리인 동의서 (26% relevance) — **완전 무관**

### 6.2 개선안 3가지 + 추천

| # | 개선 | 설명 |
|---|------|------|
| 1 | **Relevance threshold** | cosine + keyword score < 0.35 → 인용 미표시, “서재에 관련 자료 없음” |
| 2 | **Hybrid retrieval + rerank** | top-20 retrieval → cross-encoder/LLM rerank top-3 |
| 3 | **Web search fallback** | RAG miss or legal/current-events query → `WebSearch`/Gemini grounding |

**추천:** **1 + 3 조합 (P0)** — 구현 비용 대비 효과最大. 2는 P1.

### 6.3 구현 스케치

```
User query
  → classify (legal / factual / doc-specific)
  → if doc-specific: RAG search
  → if score max < THRESHOLD OR legal: web search
  → merge contexts with source tags [서재 n] [웹 n]
  → generate + CitationCards
```

**파일:** `ragSearch.ts`, `zeffContext.ts`, `backendRoute.ts`, `CitationCards.tsx` (i18n)

---

## 7. Phase 5 — PPT / Excel / Word 생성 품질

### 7.1 PPT 비주얼 (요청)

- 슬라이드별 **enter animation** (fade, slide, zoom — pptxgenjs transition)
- **theme preset** 주제별 (science/medical/business — `tools.ts` PPT_INSTRUCTION已有)
- “템플릿” = slide master color + font + shape style per deck topic

**파일:** `pptx.ts`, `toolGeneration.ts`

### 7.2 RAG 연동 극대화

| 단계 | RAG 활용 |
|------|----------|
| Outline | 서재 top chunks → slide titles |
| Fill | chunk별 bullet source |
| QA | slide footnote `[n]` |

### 7.3 RAG 외 품질 극대화 방안 3가지

1. **2-pass generation** (已有) + **outline user confirm** optional step  
2. **Style reference upload** — 사용자 PPT 1개 업로드 → theme extract  
3. **Domain template library** — `data/templates/ppt/{business,education,medical}.json`

---

## 8. Phase 6 — AI 자체 검열 (Moderation PRD)

### 8.1 목표

성적 콘텐츠, 소스코드/보안 공격 프롬프트, 개인정보 추출, 자해·불법 행위 등 **서버-side pre-filter** + **응답 refusal**.

### 8.2 검열 카테고리

| Category | Detect | Action |
|----------|--------|--------|
| Sexual explicit | keyword + classifier | block |
| CSAM / minor | zero tolerance | block + log |
| Credentials exfil | “env”, “DATABASE_URL”, “admin password” | block |
| Source exfil | “전체 코드 보여줘”, “api key” | redact/refuse |
| PII request | “다른 사용자 이메일” | refuse |
| Violence/weapon how-to | instructional | refuse + safe redirect |
| Jailbreak | “ignore instructions” | strip + log |

### 8.3 아키텍처

```
POST /api/chat
  → moderateInput(text) → { allowed, category, sanitized }
  → if !allowed: 200 + policy message (no 500)
  → optional: moderateOutput(stream filter)
```

**파일 (신규):** `src/lib/moderation.ts`, `src/lib/moderationPolicy.ts`  
**Admin:** `/admin/security/moderation` 로그 (기존 security program 연동)

### 8.4 false positive

- 의료·법률 **교육 목적** 질문 → allow with disclaimer  
- “흉기 법” 같은 **법률 정보** → allow (검열 아님)

---

## 9. Phase 7 — 법률 문서 (deep-research)

### 9.1 범위

| 문서 | 앵커 | 조사 주제 |
|------|------|-----------|
| 이용약관 | `#terms` | SaaS 표준, 유료/무료, 해지, 면책, 준거법 |
| 개인정보처리방침 | `#privacy` | PIPA, OAuth, Vercel/Neon/Blob 위탁, 국외이전 |
| 국제 이용 | `#international` | GDPR/CCPA/APPI 참고 고지 |
| 동의 | `#consent` | 마케팅·분석 선택 |

### 9.2 deep-research 워크플로

1. `python3 .agents/skills/deep-research/scripts/research.py` (롤백 시 clone 또는 일회성)
2. 비교 대상: Notion, Linear, Vercel, 국내 SaaS 약관
3. `legalContent.ts` + `landingI18n` placeholder 제거
4. `[사업자 소재지]`, `[통신판매업]` → 실제 값 또는 “준비 중” 최소 고지

### 9.3 필수 조항 체크리스트

- [ ] 서비스 정의·이용자 의무  
- [ ] 계정·OAuth·탈퇴·데이터 삭제  
- [ ] 유료 결제·환불 (Paymentwall/Stripe 상태 반영)  
- [ ] AI 생성물 disclaimer  
- [ ] 제3자 제공·처리위탁 표  
- [ ] 만 14세 미만  
- [ ] 분쟁·준거법 (한국)  
- [ ] 문의처: zeff@zeffai.com  

---

## 10. Phase 8 — 워크스페이스 작업 패널 아이디어 3가지

| # | 아이디어 | 설명 |
|---|----------|------|
| 1 | **Context Dock** | 오른쪽 패널 상단에 “현재 대화에 붙은 서재 문서·워크스페이스” chips — 클릭 시 미리보기 |
| 2 | **Output Timeline** | Files 탭을 시간순 카드( PPT/Excel/이미지 ) + “이어서 수정” 버튼 |
| 3 | **Plan + Execute split** | Agent 모드 시 Plan 탭 고정, 단계 클릭 시 터미널 해당 구간 scroll |

---

## 11. Phase 9 — 이미지 생성 (별도 승인)

**현재 버그:** “멀티툴 이미지” → 무관한 still-life 출력 (Pollinations 프롬프트 drift)

**승인 후 PRD 항목:**

- Prompt enhancement layer (tool-specific system prefix)
- Negative prompt default
- Provider priority tuning
- User preview before quota consume

**이번 스프린트:** 기록만, **구현 착수 금지**.

---

## 12. Implementation Roadmap

| Phase | 내용 | 의존성 |
|-------|------|--------|
| **0** | `06c604a` revert | — |
| **1A** | Footer, back nav, header/menu color, download hide | 0 |
| **1B** | Scroll sections redesign + library promo | 1A |
| **1C** | nothing-design token pass (hero, typography) | 1B |
| **2** | Admin UX | 1A |
| **3A** | Chat composer, loading, avatars, icon actions | — |
| **3B** | Quality tier + intent fix + placeholder cleanup | 3A |
| **4** | RAG threshold + web fallback | 3B |
| **5** | PPT theme/animation + RAG outline | 4 |
| **6** | Moderation | 3B |
| **7** | Legal deep-research | 0 (research offline OK) |
| **8** | Panel ideas (1~2개 MVP) | 3A |
| **9** | Image gen | **사용자 승인** |

**병렬 가능:** 7 (legal) ‖ 1B ; 6 (moderation) ‖ 4 (RAG)

---

## 13. Acceptance Tests

### 홈페이지
- [ ] 햄버거 open 시 header bg === drawer bg (light/dark)
- [ ] Footer links 우측, 대표 정보 하단
- [ ] Download CTA 미표시, `/download` 직접 URL 접근 가능
- [ ] `/vision` → 뒤로 → `/` (not `/about`)
- [ ] WorkLecture 3 scene 시각적으로 구분 가능 (스크린샷 diff)

### 워크스페이스
- [ ] “ppt 생성은 무슨 ai로 하나요” → 일반 답변, 에러 없음
- [ ] 로딩 시 status가 logo 옆
- [ ] Model message avatar = Logo (theme aware)
- [ ] Action buttons icon-only, aria-label present
- [ ] 흉기 법 질문 → 여권법 인용 없음

### Admin
- [ ] Admin session → hamburger + header admin link → `/admin`

### Legal
- [ ] No `[placeholder]` in legal body
- [ ] Privacy includes OAuth + cloud processors

---

## 14. File Touch List (예상)

```
src/components/landing/Header.tsx
src/components/landing/Footer.tsx
src/components/landing/Hero.tsx
src/components/landing/WorkLectureScroll.tsx
src/components/landing/FeatureShowcase.tsx
src/components/landing/FeatureGrid.tsx
src/components/ui/BackButton.tsx
src/components/company/CompanyPageContent.tsx
src/components/ChatWorkspace.tsx
src/components/CitationCards.tsx
src/components/ui/Logo.tsx
src/lib/intentTools.ts
src/lib/tools.ts
src/lib/toolGeneration.ts
src/lib/pptx.ts
src/lib/ragSearch.ts
src/lib/zeffContext.ts
src/lib/backendRoute.ts
src/lib/legalContent.ts
src/lib/landingI18n/*.ts
src/lib/i18n.ts
src/lib/moderation.ts (new)
docs/PRD_KX_UX_OVERHAUL_2026-07.md (this)
```

---

## 15. Open Questions

1. **다운로드 메뉴:** 햄버거 `/download` 항목도 숨길지, 페이지만 유지할지?
2. **humanizer 스킬:** 레포에 재설치할지, copy-editing 수동만 할지?
3. **품질 tier 기본값:** 중간 vs 사용자 last choice?
4. **Web search provider:** Gemini grounding vs Tavily vs built-in?
5. **법인 정보:** 사업자등록·통신판매업 실제 값 제공 시점?

---

## 16. Appendix — nothing-design Homepage Wireframe (ASCII)

```
┌─────────────────────────────────────────────────────────┐
│ [≡]  ZEFF AI                    (sun) (ko▾) (로그인)    │  ← transparent → solid on scroll/menu
├─────────────────────────────────────────────────────────┤
│                                                         │
│              DOCUMENT · CHAT · LIBRARY                  │  ← Space Mono label
│                                                         │
│         ┌─────────────────────────────────┐             │
│         │  3 formats                      │             │  ← Doto hero number
│         │  1 workspace                    │             │
│         └─────────────────────────────────┘             │
│         잡음 속에서 핵심만 남기는 AI                      │  ← Space Grotesk
│                                                         │
│              [ 웹에서 시작하기 → /app ]                   │  ← single red accent CTA
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ▶ demo video (math)                                    │
├─────────────────────────────────────────────────────────┤
│  sticky scroll: PPT | Excel | Lecture  (3 unique mocks) │
├─────────────────────────────────────────────────────────┤
│  feature grid + LIBRARY card                            │
├─────────────────────────────────────────────────────────┤
│  pricing                                                │
├─────────────────────────────────────────────────────────┤
│              support · terms · privacy · inquiry        │
│              ZEFF AI · zeff@zeffai.com · 대표            │
└─────────────────────────────────────────────────────────┘
```

---

*End of PRD*
