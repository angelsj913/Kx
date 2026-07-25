# PRD: 랜딩페이지 — Safari 빈 화면 + 헤더 색 불일치 근본 수정

> 상태: 초안 (승인 대기) · 작성일 2026-07-25
> 보고 경로: iPhone Safari에서 `kx-git-feat-security-program-v2-kxeung9.vercel.app` 접속
> 증상: (1) 스크롤해도 아무 일 없는 거대한 빈 화면 (2) 헤더 바와 본문 배경색 불일치

---

## 1. Context — 왜 지금 이걸 고치는가

사용자가 모바일 Safari에서 두 가지를 보고했다. 색 불일치는 **이미 3번 수정된 이력**이 있고 매번 재발했다.
조사 결과 **서로 무관한 두 개의 독립 버그**이며, 그중 하나는 **현재 프로덕션 main에 배포된 P0 장애**다.

핵심: 색 불일치는 "색상 값이 틀린 문제"가 아니라 **구조적 설계 문제**라서, 지금까지의 상수 튜닝식 수정은 반드시 재발한다.

---

## 2. 근본 원인 A — 【P0】 CSP가 사이트의 모든 JavaScript를 차단

### 확정 증거 (가설 아님, 런타임 실측)

로컬 프로덕션 서버(`next start`)에서 직접 확인:

```
응답 헤더 : script-src 'self' 'nonce-e621e032-019e-400b-ba6d-38c30482d4c3' 'strict-dynamic'
HTML 내 nonce= 출현 횟수 : 0
실제 스크립트 태그 : <script src="/_next/static/chunks/0kamlqgum-7ax.js" async="">   ← nonce 없음
```

### 메커니즘

1. `src/proxy.ts:32` 가 프로덕션 CSP에 **`'strict-dynamic'`** 을 넣는다.
2. CSP3 규격상 `strict-dynamic`이 있으면 **`'self'` 같은 호스트 출처는 전부 무시**되고, nonce/hash가 일치하는 스크립트만 실행된다.
3. Next.js는 nonce를 `x-nonce`가 **아니라** *요청 헤더의* `Content-Security-Policy`를 파싱해서 얻는다
   (`node_modules/next/dist/server/app-render/get-script-nonce-from-header.js`).
   `proxy.ts:50` 은 `x-nonce`만 요청 헤더에 넣고, CSP는 **응답에만**(`:54`) 설정한다 → Next.js는 nonce를 영영 모른다.
4. 결과: `/_next/static/chunks/*.js` **전부 차단 → 하이드레이션 실패 → 클라이언트 JS 전무.**

### 왜 "스크롤 빈 화면"으로 보이는가

스크롤 섹션의 콘텐츠가 framer-motion `initial={{opacity:0}}` 상태로 **SSR HTML에 그대로 박혀서** 나간다.
JS가 죽으면 이 `opacity:0`을 걷어낼 주체가 없어 **영구히 안 보인다.** 제목은 순수 HTML이라 보인다 — 스크린샷과 정확히 일치.

```html
<!-- 빌드 산출물 .next/server/app/index.html 실제 내용 -->
<div class="landing-card ..." style="opacity:0;transform:scale(0.96)">      <!-- WhyZeff 본문 전체 -->
<div style="opacity:0;transform:translateY(14px)">                          <!-- FeatureShowcase 좌측 전체 -->
```

여기에 `h-[360vh]`(WhyZeff) / `h-[440vh]`(FeatureShowcase) sticky 래퍼가 그 안 보이는 프레임을
**화면 3.6~4.4개 높이로 늘려서** "스크롤해도 아무 일 없는 거대한 공백"이 된다.

### 치명적 제약 — nonce 방식은 이 앱에서 애초에 불가능

랜딩(`/`)은 **정적 프리렌더 페이지**다 (`.next/server/app/index.html` 존재 확인).
정적 페이지는 요청마다 다른 nonce를 넣을 수 없다 — Next.js 공식 문서도 nonce는 동적 렌더링 전용이라고 명시한다.
즉 **`requestHeaders.set("Content-Security-Policy", ...)` 를 추가해도 정적 페이지에서는 해결되지 않는다.**

### 책임 소재 (투명하게)

이 CSP는 원래 진행 중이던 보안 하드닝 WIP(`src/middleware.ts`)에 있던 코드이고,
**내가 Next.js 16 빌드 충돌을 풀면서 `proxy.ts`로 통합해 main에 병합**했다(PR #46).
병합 전 main은 `next.config.ts`의 관대한 CSP(`'unsafe-inline'` 허용)를 써서 JS가 정상 동작했다.
버그를 만든 건 아니지만 **프로덕션에 올린 것은 내 병합**이다.

---

## 3. 근본 원인 B — 헤더 색 불일치 (3번 재발한 진짜 이유)

### 구조적 모순

| 요소 | 성질 |
|---|---|
| 헤더 (`Header.tsx:71-75`) | `position: fixed` + **상수** 색 `color-mix(--landing-gradient-start 72%)` = `rgba(240,245,255,.72)` |
| 헤더 뒤 배경 (`globals.css:134`) | `.landing-shell` 이 **문서 전체 높이(~15,000px)** 에 걸친 `linear-gradient(180deg, #f0f5ff 0%, #f8fafc 45%, #ffffff 100%)` |

**헤더 색은 고정, 뒤 배경은 스크롤에 따라 변한다.** 문서 45% 지점을 지나면 뒤 배경은 말 그대로 `#ffffff`인데
헤더는 여전히 `#f0f5ff` 계열 → 차가운 띠가 보인다. `scrollY === 0`에서만 맞을 수 있는 설계다.

### 두 번째 원인 — 섹션이 자기 배경을 덮어씀

```tsx
// FeatureShowcase.tsx:580  — 440vh 를 불투명하게 덮어 shell 그라데이션을 지움
className="relative h-[440vh] bg-gradient-to-b from-white via-slate-50 to-slate-100 ..."
// Pricing.tsx:63 — 동일 패턴
```

`.landing-shell > *:not(header)` 규칙이 `<main>`을 `z-index:1`로 올려두기 때문에,
이 불투명 배경들이 shell 그라데이션과 글로우를 **완전히 가린다** → 헤더 뒤는 순백, 헤더는 연보라.

### 과거 3회 수정이 전부 실패한 이유

| # | 커밋 | 한 일 | 실패 이유 |
|---|---|---|---|
| 1 | `98ad970` | 헤더를 `--landing-bg`(#fff)에서 파생 | 스크롤 상태에서만 배경 생겨 그때 띠 발생 |
| 2 | `06046bb` | 하드코딩 `#f0f5ff`/`#eef4ff`/`#f5f8ff` 3색 사용 | 세 값이 달라 스크롤 시 **색조 자체가** 바뀜 |
| 3 | `8cc3329` | `--landing-gradient-start` 도입해 한 값에서 파생 | **여전히 상수** — 뒤 배경이 변하는 문제는 그대로 |

세 번 모두 **상수 값 튜닝**이었고, "고정 헤더 vs 문서 전체 그라데이션"이라는 구조는 한 번도 안 건드렸다.
같은 방식의 4번째 수정은 반드시 또 재발한다.

---

## 4. 수정 방안

### Phase 1 — 【P0 · 즉시】 CSP 정상화

**목표: 프로덕션 JS 복구.** 정적 페이지에서 동작하는 CSP로 교체.

`src/proxy.ts`:
- `'strict-dynamic'` **제거** (정적 페이지와 근본적으로 양립 불가)
- nonce 생성·`x-nonce` 주입 **제거** (아무도 소비하지 않는 죽은 코드)
- `script-src 'self' 'unsafe-inline'` 로 변경 — Next.js는 하이드레이션 데이터를 인라인 `<script>`로 넣으므로 필수
- 나머지 방어 헤더(HSTS/nosniff/Referrer/Permissions/frame-ancestors/object-src)는 **그대로 유지**

> 보안 트레이드오프를 숨기지 않는다: `unsafe-inline`은 XSS 방어를 약화시킨다.
> 다만 (a) 병합 전 프로덕션이 쓰던 것과 동일한 수준이고, (b) 사이트 전체가 죽어 있는 것보다 낫다.
> 진짜 nonce CSP를 원하면 랜딩을 동적 렌더링으로 바꿔야 하며, 이는 성능 손실을 동반하는 **별도 과제**로 분리한다.

**자가점검 연동:** `src/lib/security/checks.ts`의 `http.csp_no_unsafe_inline` 체크가 이 변경으로 `fail`이 된다.
→ 해당 체크에 "정적 렌더링 앱에서는 nonce 불가"라는 예외 사유를 명시하거나 `warn`으로 강등하고, 이유를 detail에 기록한다.
(체크를 조용히 지우지 않는다 — 근거를 남긴다.)

### Phase 2 — 【P1】 JS 없이도 콘텐츠가 보이게 (방어선 이중화)

CSP를 고쳐도 **JS 실패 시 통째로 빈 화면**이 되는 구조 자체가 위험하다. 이미 팀이 히어로에 같은 처방을 했다
(`globals.css:80-83` 주석 — "CSS 키프레임은 JS와 무관하게 즉시 보인다", `.hero-fade-up`).
동일 원칙을 스크롤 섹션에도 적용:

- `WhyZeff.tsx:234`, `FeatureShowcase.tsx:594`, `WorkLectureScroll.tsx:236` 의 `initial={{opacity:0,...}}`
  → **기본 가시 상태로 전환**(`initial={false}` 또는 CSS 키프레임 `.hero-fade-up` 재사용)
- `FeatureShowcase.tsx:541` 의 reduced-motion 폴백이 `whileInView`+`opacity:0` → iOS **Reduce Motion 사용자에게 같은 빈 화면**을 유발하는 독립 경로. 폴백은 무조건 보이게 한다.

### Phase 3 — 【P1】 헤더 색 구조 수정 (재발 차단)

**원칙: 헤더 색을 배경에 맞추려 하지 말고, 헤더 뒤 배경을 스크롤과 무관한 상수로 만든다.**

1. **그라데이션을 뷰포트에 고정** — `.landing-shell`의 문서 전체 그라데이션을 제거하고,
   이미 존재하는 `position: fixed` 의사요소 레이어(`globals.css:138-145`)로 옮긴다.
   → 화면 최상단 색이 **항상** `--landing-gradient-start` 가 되어 헤더가 모든 스크롤 위치에서 일치.
   (`background-attachment: fixed`는 iOS Safari에서 깨지므로 **쓰지 않는다** — fixed 레이어 방식이 iOS 안전.)
2. **섹션의 불투명 배경 제거** — `FeatureShowcase.tsx:580`, `Pricing.tsx:63` 을 투명하게 바꿔 shell 표면이 비치게 한다.
3. **`body` 배경을 그라데이션 시작색과 통일** — iOS 고무줄 스크롤(overscroll) 시 위쪽에 흰 띠가 드러나는 두 번째 seam 제거.
4. **스크롤 상태 전환 완화** — 8px에서 `72%→90%` 불투명도 + `blur-[2px]→blur-md` 동시 점프는 눈에 띈다. 임계값·폭을 줄인다.

### Phase 4 — 【P2】 Safari 보강 (같은 배포에 묶어도 무방)

- `.landing-card`의 `backdrop-filter`에 **`-webkit-backdrop-filter` 추가** (미접두 버전은 Safari 18+ 전용)
- 스크롤 섹션 높이 단위 통일: 래퍼는 `vh`, 자식은 `svh` 혼용 → iOS에서 진행도가 1.0에 도달 못 함. `svh`로 통일
- `template.tsx`의 `.page-transition { animation: ... both }` — `fill-mode: both`라 애니메이션이 드롭되면 페이지 전체가 `opacity:0`으로 남는다. bfcache 복귀 등에서 위험하므로 안전한 형태로 조정 검토

---

## 5. 영향 파일

| 파일 | Phase | 변경 |
|---|---|---|
| `src/proxy.ts` | 1 | strict-dynamic·nonce 제거, `script-src 'self' 'unsafe-inline'` |
| `src/lib/security/checks.ts` | 1 | `http.csp_no_unsafe_inline` 예외 사유 명시 / warn 강등 |
| `src/components/landing/WhyZeff.tsx` | 2 | `initial` opacity:0 제거 |
| `src/components/landing/FeatureShowcase.tsx` | 2,3 | `initial`·`whileInView` 폴백 수정 + 불투명 배경 제거 |
| `src/components/landing/WorkLectureScroll.tsx` | 2 | `initial` opacity:0 제거 |
| `src/app/globals.css` | 3,4 | 그라데이션을 fixed 레이어로 이동, body 배경 통일, `-webkit-backdrop-filter` |
| `src/components/landing/Pricing.tsx` | 3 | 불투명 배경 제거 |
| `src/components/landing/Header.tsx` | 3 | 스크롤 전환 완화 |

---

## 6. 검증 계획

**정적 검증 (내가 수행)**
- [ ] `npx tsc --noEmit` · `npx eslint` clean
- [ ] `npm run build` 성공
- [ ] **결정적 회귀 테스트**: `next start` 후 `curl -s localhost:PORT | grep -c 'nonce='` 및
      CSP 헤더 확인 → 스크립트가 차단되지 않는 CSP인지 실측
- [ ] 빌드 HTML에 `style="opacity:0"` 가 스크롤 섹션에서 **사라졌는지** grep 확인
- [ ] 자가점검 28종 재실행(FAIL 0 유지, CSP 체크는 근거 있는 warn)

**실기기 검증 (사용자 확인 — 합의된 방식)**
- [ ] 브랜치 푸시 → Vercel 프리뷰 URL 전달 → **iPhone Safari에서 직접 확인**
- [ ] 확인 항목: (1) 스크롤 시 섹션 콘텐츠가 실제로 나타나는가 (2) 헤더/본문 경계선이 사라졌는가
      (3) 페이지 상단·중간·하단 모두에서 헤더 색이 일치하는가 (4) 설정에서 **Reduce Motion을 켠 상태**에서도 콘텐츠가 보이는가
- [ ] 프로덕션 병합 후 실제 도메인에서 재확인

---

## 7. 리스크

| 리스크 | 완화 |
|---|---|
| `unsafe-inline` 도입으로 XSS 방어 약화 | 병합 전 프로덕션과 동일 수준. 나머지 방어 헤더 유지. 진짜 nonce는 동적 렌더링 과제로 분리 |
| 그라데이션 뷰포트 고정으로 **시각적 인상이 바뀜** (모든 화면에 동일한 은은한 그라데이션) | 디자인 판단이 필요 — 아래 승인 질문 참조 |
| 섹션 배경 제거로 섹션 구분감 약화 | 필요 시 경계는 그림자·구분선 등 불투명 배경이 아닌 수단으로 표현 |
| 프로덕션 즉시 배포 부담 | Phase 1만 먼저 핫픽스로 분리 배포 가능 |

---

## 8. 승인 받을 것

1. **Phase 1(CSP)을 즉시 핫픽스로 먼저 배포**할지, 아니면 Phase 1~4를 한 PR로 묶을지?
2. 배경 구조 변경 방향 — **(a) 그라데이션을 뷰포트 고정**(모든 화면에 은은한 그라데이션, 헤더 완전 일치)
   vs **(b) 배경을 단색으로 평탄화**(가장 단순·확실, 그라데이션 연출 포기)?
3. 섹션 불투명 배경 제거에 동의하는지(디자인 인상 변화 있음)?

---

_승인되면 Phase 순서대로 구현하고, 6장 검증을 거쳐 프리뷰 URL을 전달합니다._
