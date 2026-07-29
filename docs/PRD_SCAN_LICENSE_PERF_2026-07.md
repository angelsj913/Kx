# PRD: Security Scan Fix · Skill License · Site Performance

| Field | Value |
|-------|--------|
| **Product / Feature** | 보안 스캔 런타임 오류 수정, 스킬 상업 라이선스 정리, 전역 성능 개선 |
| **Status** | Draft → Implementation ready (Wave A partial done) |
| **Author** | Cursor agent |
| **Stakeholders** | Product owner (`zeff@zeffai.com`), engineering |
| **Date Created** | 2026-07-29 |
| **Version** | 1.0 |
| **Depends on** | [PRD_ZEFF_SECURITY_PROGRAM](./PRD_ZEFF_SECURITY_PROGRAM.md), Supabase runtime pooler fixes on `main` |
| **Code name** | `zeff-scan-perf` |
| **Branch** | `cursor/security-perf-prd-a14a` |

---

## 1. Executive Summary

관리자 Security Program에서 스캔이 `Cannot find package '@/lib'`로 실패하고, 사이트 전반이 느리며, 스킬 카탈로그의 상업 사용 가능 여부가 불명확하다.  
이 PRD는 **(A) 즉시 수정**, **(B) 라이선스 결론**, **(C) 성능 Wave**를 한 문서로 묶는다.

**One-liner:** 스캔을 고치고, 스킬은 Apache-2.0으로 상업 사용 가능함을 문서화하며, 랜딩·`/app` TTFB/번들을 줄여 체감 속도를 회복한다.

---

## 2. Problem Statement

### 2.1 Security scan runtime error (이미지 1)

**증상:** `/admin/security`에서 스캔 실패 배너:

```text
Cannot find package '@/lib' imported from /var/task/.next/server/chunks/[root-of-the-server]__….js
```

**원인 (확인됨):**

`src/lib/security/scan.ts`가 Turbopack NFT 경고를 피하려고:

```ts
await import(/* turbopackIgnore: true */ "@/lib/security/checks")
```

를 사용한다. `turbopackIgnore: true`는 Next 경로 alias(`@/`) 해석을 **건너뛰고** Node 런타임 `import()`로 넘긴다. Node는 `@/lib`를 **npm 패키지 이름**으로 해석 → Vercel `/var/task`에서 패키지를 찾지 못함.

**영향:** 보안 점수·Finding이 비어 있고 Critical/High가 항상 0으로 보임.

### 2.2 UI copy (이미지 2)

보안 에이전트 헤더 문구:

> 스캔·Finding·큐레이션 스킬만 근거로 답합니다. **공격/해킹 요청은 거절합니다.**

제품 요청: 뒤 문장 삭제. (서버 가드레일 `agentRoute.ts`의 거절 로직은 유지 — UI 카피가 아님.)

### 2.3 Skill commercial license (이미지 3)

카탈로그에 보이는 스킬 예:

| Skill id | Domain |
|----------|--------|
| `testing-api-authentication-weaknesses` | api-security |
| `testing-for-broken-access-control` | web-application-security |
| `testing-api-security-with-owasp-top-10` | api-security |
| `testing-for-sensitive-data-exposure` | web-application-security |
| `testing-for-xss-vulnerabilities` | web-application-security |

원본 저장소: [`mukul975/Anthropic-Cybersecurity-Skills`](https://github.com/mukul975/Anthropic-Cybersecurity-Skills)  
**LICENSE = Apache License 2.0** (Copyright 2026 mukul975).

### 2.4 Site feels unbearably slow

실측·코드 기준 상위 병목:

1. **Root layout 폰트 6종** (Space/Doto 미사용 포함) + woff2 preload 과다  
2. **`/app` 요청당 `auth()` 3회 + DB** (`proxy` → layout → `requirePasswordComplete`) + JWT `sessionVersion` 5초 재조회  
3. **거대 클라이언트 번들** (`i18n.ts` 8개 로케일 eager, `ChatWorkspace` 정적 import 다수)  
4. **랜딩 sticky scroll 3섹션 + SessionProvider**가 마케팅 페이지에 불필요  
5. **`proxy = auth()` matcher가 전 HTML 경로** — `/`·`/pricing`에도 Auth.js 실행  

추가로 최근 Supabase **세션 풀 고갈**이 “비밀번호 오류 / Something went wrong”로 위장된 바 있음(이미 `:6543` + `max:1`로 완화). 성능 PRD는 풀 안정성을 전제로 한다.

---

## 3. Goals / Non-goals

### Goals

| ID | Goal | Success criteria |
|----|------|------------------|
| G1 | 보안 스캔이 프로덕션에서 완료 | 스캔 status=`completed`, 배너에 `@/lib` 오류 없음, Finding ≥ 1건 가능 |
| G2 | 에이전트 UI에서 지정 문구 제거 | 헤더에 “공격/해킹 요청은 거절합니다” 없음 |
| G3 | 스킬 상업 사용 정책 문서화 | Apache-2.0 결론 + 준수 체크리스트가 PRD/README에 존재 |
| G4 | 체감 성능 개선 | 아래 Wave A/B 메트릭 달성 |

### Non-goals

- 외부 호스트 공격 스캔·exploit PoC 실행  
- 스킬 원본 800+ 전체를 앱에 재배포  
- 디자인 전면 리브랜딩  
- Neon 재도입  

---

## 4. License verdict (상업적 사용)

### 결론: **상업적으로 사용 가능 (Apache-2.0)**

Apache-2.0은 다음을 **허용**한다:

- 상업 제품에서의 사용·수정·배포  
- 특허 라이선스(기여자 특허)  
- SaaS(ZEFF) 내부 도구로 스킬 **지식/절차를 참고**해 우리 점검 코드를 작성  

**필수 준수 (재배포 시):**

1. LICENSE 사본 제공  
2. 수정 파일에 변경 고지  
3. 원저작 NOTICE/저작권 고지 유지  
4. 상표(“Anthropic” 등)를 허가 없이 제품명처럼 사용하지 않음  

### ZEFF의 실제 사용 형태 (리스크 낮음)

Security Program은 스킬 **원본을 실행·재배포하지 않는다**.  
`skillIds`는 Finding 근거 라벨이고, 점검 로직은 `src/lib/security/checks.ts`에 **우리가 작성한 읽기 전용 정적 검사**다.

권장 운영:

| 항목 | 조치 |
|------|------|
| 카탈로그 UI | 스킬 카드에 `license: Apache-2.0` · `source: mukul975/Anthropic-Cybersecurity-Skills` 표시 |
| 저장소 | `docs/THIRD_PARTY_SECURITY_SKILLS.md`에 출처·LICENSE 링크 |
| 금지 | 공격 스킬(exploit/C2) UI 노출·실행 (기존 정책 유지) |
| 법무 | 대규모 스킬 원문 동봉 배포 시 NOTICE 파일 추가 — 현재는 ID+요약만이면 충분 |

> 이 문서는 법률 자문이 아니다. 대규모 원문 재배포·화이트라벨 판매 시 별도 법무 검토 권장.

---

## 5. Solution Design

### Wave A — Immediate (이번 브랜치)

| # | Change | File(s) |
|---|--------|---------|
| A1 | Dynamic import를 상대경로 `./checks`로 변경 | `src/lib/security/scan.ts` |
| A2 | UI 문구 삭제 | `src/components/admin/SecurityAgentClient.tsx` |
| A3 | 본 PRD + 라이선스 노트 추가 | `docs/PRD_SCAN_LICENSE_PERF_2026-07.md` |

### Wave B — Performance (후속 구현 PR)

우선순위 = 체감 임팩트:

| P | Work | Detail | Target |
|---|------|--------|--------|
| P0 | 폰트 축소 | Root에서 미사용 `Space_Grotesk`/`Space_Mono`/`Doto` 제거. Noto KR weight 축소, preload 최소화 | LCP −폰트 워터폴 |
| P0 | `/app` auth 1회화 | layout에서만 `auth()`; password 완료 여부를 같은 패스에서 조회; `proxy` matcher를 `/app/**`로 축소, 공개 라우트 CSP는 `next.config` headers | `/app` TTFB ↓ |
| P1 | JWT sv 재조회 완화 | `sessionVersion` 재검사 간격 5s → 60–300s | DB QPS ↓ |
| P1 | i18n 분할 | `src/lib/i18n.ts` eager 8로케일 → 활성 locale dynamic import | JS ↓ 100KB+ |
| P1 | ChatWorkspace 지연 로딩 | SettingsModal / KnowledgeBase / Structured views `dynamic()` | 초기 chat 번들 ↓ |
| P2 | 랜딩 SessionProvider 분리 | 마케팅 페이지에서 session fetch 제거; below-fold scroll `ssr:false` + IO mount | `/` TTI ↓ |
| P2 | 스크롤 리스너 통합 | sticky 섹션 공통 scroll progress | 메인스레드 jank ↓ |

### Wave C — Security polish (선택)

- 스킬 카탈로그에 license/source 배지  
- 스캔 실패 시 사용자용 짧은 메시지 + digest 로깅  
- `checks.ts` 정적 import로 되돌릴지(NFT vs 안정성) 재평가 — A1 상대경로로 당분간 유지  

---

## 6. User Stories

1. **관리자로서** 보안 스캔을 누르면, 패키지 오류 없이 점수·Finding이 갱신되길 원한다.  
2. **관리자로서** 에이전트 화면에서 공격 거절 카피가 눈에 띄지 않길 원한다(가드레일은 서버에 유지).  
3. **운영자로서** 카탈로그 스킬을 SaaS에 써도 법적으로 문제없는지 알고 싶다.  
4. **모든 사용자로서** 랜딩과 `/app` 진입이 답답하지 않길 원한다.

---

## 7. Acceptance Criteria

### Wave A

- [ ] 프로덕션에서 “지금 스캔” → scan `completed`, 오류 문자열에 `@/lib` 없음  
- [ ] Security Agent 헤더에 “공격/해킹 요청은 거절합니다.” 없음  
- [ ] 본 PRD가 `docs/`에 커밋됨  
- [ ] 라이선스 절이 Apache-2.0 상업 사용 **허용**으로 명시됨  

### Wave B (후속)

- [ ] Root 폰트 ≤ 3 families  
- [ ] 공개 페이지 proxy에서 `auth()` 미실행 (matcher `/app` only 또는 동등)  
- [ ] `/app` RSC에서 `auth()` 호출 ≤ 1회/요청 (레이아웃 기준)  
- [ ] Lighthouse 또는 Web Vitals: mobile LCP 개선 전후 기록  

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| `./checks` 상대경로가 다른 번들러에서 깨짐 | nodejs runtime 고정 + 스캔 E2E |
| proxy matcher 축소 후 `/app` 미보호 | matcher 테스트 + e2e redirect |
| 폰트 제거 후 랜딩 타이포 깨짐 | 시각 QA, CSS var 참조 grep |
| Apache NOTICE 누락 주장 | ID-only 큐레이션 유지 + THIRD_PARTY doc |

---

## 9. Rollout

1. Merge Wave A → Vercel deploy → 관리자가 스캔 1회 검증  
2. Wave B를 별도 PR로 P0→P1 순서 머지 (폰트 / auth / i18n)  
3. Wave C는 여유 시  

---

## 10. Open Questions (기본값으로 진행)

| Question | Default |
|----------|---------|
| Wave B를 같은 PR에 넣을까? | **No** — A 먼저, B는 성능 전용 PR |
| 스킬 원문을 앱 번들에 넣을까? | **No** — ID + 요약 + check 매핑만 |
| 서버 공격 거절 프롬프트도 약화할까? | **No** — UI만 삭제, 서버 가드레일 유지 |

---

## 11. Appendix — Error anatomy

```
Cannot find package '@/lib'
  ← Node package resolver
  ← dynamic import("@/lib/security/checks")
  ← /* turbopackIgnore: true */ skipped alias rewrite
  ← Vercel serverless /var/task
```

**Fix:** `import(/* turbopackIgnore: true */ "./checks")`  
(동일 디렉터리 `src/lib/security/checks.ts`)
