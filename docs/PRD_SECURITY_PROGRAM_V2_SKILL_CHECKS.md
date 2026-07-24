# PRD: ZEFF Security Program v2 — 스킬 기반 점검팩 확장

> 선행 문서: [`PRD_ZEFF_SECURITY_PROGRAM.md`](./PRD_ZEFF_SECURITY_PROGRAM.md)
> 이 문서는 그 PRD의 **Phase 2 "Deeper Scanners"** 를 구체화한 실행 PRD다.
> 상태: 초안 (승인 대기)

---

## 1. Executive Summary

v1은 자가점검 12종(`src/lib/security/checks.ts`)으로 관리자 보안 대시보드를 이미 제공한다.
이번 세션에 `~/.claude/skills`로 사이버보안 방어 스킬 1000+개가 설치되었다.
v2는 그중 **방어·탐지·하드닝 스킬만 읽어**, 각 스킬의 점검 절차 중 이 앱(Next.js SaaS)에
정적으로 적용 가능한 부분만 **새 체크 러너 코드로 구현**해 점검팩을 ~12 → ~24종으로 확장한다.

**원칙(v1 승계, 변경 없음):**
- 모든 점검은 **읽기 전용 · 자기 자신(self)** — 우리 저장소 소스/설정/의존성만 검사. 외부 URL·타 시스템 스캔 금지.
- 스킬 코드를 그대로 실행/복붙하지 않는다. 스킬을 **읽고** 필요한 점검 로직만 우리 코드로 작성한다.
- 공격 스킬(exploit/C2/privesc)은 참조하지 않는다.
- 관리자 전용. 사용자 노출 API 없음.

## 2. Problem / Why now

- v1 점검팩은 12종으로 auth/헤더/env/deps 표면만 커버. 실제 코드베이스에는 아직 자동 점검되지 않는
  구성(CSP `unsafe-inline`, 라우트별 인증 누락 여부, 하드코딩 시크릿, 레이트리밋 커버리지 등)이 남아 있다.
- 방금 신뢰 가능한(Vercel Labs `skills` CLI, Apache-2.0) 방어 스킬 카탈로그가 로컬에 확보됨 →
  점검 항목의 "근거(skill)"를 실제 문서로 연결하면서 확장할 좋은 시점.

## 3. Goals / Non-goals

**Goals**
- G1. 스킬 근거를 가진 신규 정적 점검 ~12종 추가(도메인별 그룹).
- G2. 각 finding에 `domain` 부여 → 대시보드에서 도메인별 그룹핑/필터.
- G3. 하드코딩 시크릿 정적 스캐너 모듈 1종 추가(우리 `src/`만, 읽기 전용).
- G4. 기존 스캔 파이프라인(`runSecurityChecks` → `SecurityScan/Finding`)에 무침습적으로 편입.

**Non-goals**
- 외부 대상 스캔, 실제 익스플로잇/PoC, C2, 권한상승 — **전부 제외**.
- `git history` 재작성·시크릿 로테이션 자동화 — 리포트만, 실행은 사람.
- 실시간 런타임 IDS/트래픽 분석 — 이번 범위 아님(정적 점검만).

## 4. 신규 점검팩 (도메인별) — 스킬 → 우리 점검 매핑

각 항목: `checkId` · 근거 스킬 · 우리 앱에서의 정적 검사 방법 · 예상 결과(현 코드 기준).

### 4.1 HTTP/브라우저 하드닝 — skill: `performing-security-headers-audit`
| checkId | 검사 | 비고 |
|---|---|---|
| `http.csp_no_unsafe_inline` | `next.config.ts`/`middleware` CSP의 `script-src`에 `unsafe-inline`/`unsafe-eval` 없는지 | **현재 fail 예상**(next.config CSP에 둘 다 존재) → nonce 기반 상향 권고 |
| `http.x_content_type_options` | `X-Content-Type-Options: nosniff` 존재 | 현재 pass 예상 |
| `http.referrer_policy` | `Referrer-Policy` 존재 | 현재 pass 예상 |
| `http.permissions_policy` | `Permissions-Policy` 존재·마이크만 self | 현재 pass 예상 |
| `cookie.session_secure_flags` | NextAuth 세션 쿠키가 prod에서 `Secure`+`HttpOnly`+`SameSite` | auth 설정 정적 확인 |

### 4.2 시크릿/민감정보 — skill: `implementing-secret-scanning-with-gitleaks`, `testing-for-sensitive-data-exposure`
| checkId | 검사 | 비고 |
|---|---|---|
| `secrets.no_hardcoded_in_src` | `src/**` 정규식 스캔: `sk_live_`, `AKIA[0-9A-Z]{16}`, `-----BEGIN (RSA )?PRIVATE KEY-----`, 긴 base64/hex 토큰 등. `.env*`·예제·주석 제외 | 신규 스캐너 모듈 |
| `secrets.env_gitignored` | `.gitignore`에 `.env*` 포함 | 현재 pass 예상 |
| `data.no_passwordhash_leak` | prisma `select`에서 `passwordHash: true`가 auth 경로 밖에 없는지(응답 과다노출 방지) | 정적 grep 휴리스틱 |

### 4.3 접근제어/멀티테넌트 — skill: `testing-for-broken-access-control`
| checkId | 검사 | 비고 |
|---|---|---|
| `bac.api_routes_authed` | `src/app/api/**/route.ts` 각 핸들러가 `auth()`/`requireUserId`/`requireSecurityAdmin` 참조. 공개 allowlist(`auth`, `stripe/webhook`, `cron`, health) 제외 | 누락 라우트 목록 리포트 |
| `bac.tenant_scoping` | 워크스페이스 스코프 모델의 `findMany`가 `userId`/`workspaceId`/`itemAccessWhere` 필터 사용 | 휴리스틱, 애매하면 warn |

### 4.4 레이트리밋 — skill: `implementing-api-rate-limiting-and-throttling`
| checkId | 검사 | 비고 |
|---|---|---|
| `ratelimit.auth_endpoints` | `login`(auth.ts)·`otp`·`signup`·`reset-password`·`account/password` 경로가 `assertRateLimit`/`checkRateLimit` 호출 | 현재 대부분 pass 예상 |

### 4.5 JWT/세션 — skill: `testing-jwt-token-security`
| checkId | 검사 | 비고 |
|---|---|---|
| `jwt.session_strategy_secret` | 세션 전략 jwt + `AUTH_SECRET` 존재 + alg none 미허용(NextAuth 기본 안전) | 대부분 pass |
| `jwt.session_maxage_bounded` | 세션 `maxAge`가 무한/과도하지 않게 설정 | 정적 확인 |

> 합계 신규 ~12종. 애매한 정적 판별은 `warn`으로 두어 오탐을 재검토 대상으로만 남긴다(자동 차단 없음).

## 5. 데이터 모델 델타 (최소)

`SecurityFinding`에 그룹핑용 컬럼 1개만 추가(선택):
```prisma
model SecurityFinding {
  // ...기존 필드 유지...
  domain String? // "http" | "secrets" | "access-control" | "rate-limit" | "jwt" | "deps" | "auth" | "env"
  @@index([domain])
}
```
`SecurityCheckOutcome`(코드 타입)에 `domain: string` 추가 → `runSecurityChecks` 결과에 실려 저장 시 매핑.
`SecuritySkillRef`(스킬 카탈로그)는 이미 존재 — 신규 점검이 참조하는 스킬 id를 카탈로그와 연결만.

## 6. API / UX 델타
- API: 기존 `/api/admin/security/scan`·`/overview`·`/findings` 그대로 재사용. 스키마에 `domain`만 실림.
- UX: `SecurityDashboardClient`에 **도메인별 그룹 섹션**(HTTP/Secrets/Access/RateLimit/JWT/Deps) 추가.
  각 finding 카드에서 근거 스킬(`skillIds`) → `/admin/security/skills` 상세로 이동(이미 있는 카탈로그 재사용).
- 신규 페이지 없음. 관리자 가드(layout + 핸들러 `requireSecurityAdmin`) 그대로.

## 7. 구현 범위(파일 단위)
- `src/lib/security/checks.ts` — 신규 러너 ~12개 함수 + `DEFAULT_CHECK_IDS`/`RUNNERS`/`SecurityCheckOutcome.domain` 확장.
- `src/lib/security/secretScan.ts` (신규) — `src/**` 읽기 전용 정규식 시크릿 스캐너(제외목록·라인번호 리포트).
- `prisma/schema.prisma` — `SecurityFinding.domain` 추가(+ index). 마이그레이션 1건.
- `src/lib/security/program.ts` — 저장 시 `domain` 매핑(핵심 로직 변경 없음).
- `src/components/admin/SecurityDashboardClient.tsx` — 도메인 그룹 렌더(표시 로직만).

## 8. 검증(성공 기준)
- [ ] `npm run build` 통과 · `tsc --noEmit`/`eslint` clean.
- [ ] 관리자로 스캔 실행 시 신규 ~12종이 결과에 나타나고 도메인별로 그룹핑됨.
- [ ] `http.csp_no_unsafe_inline`·`secrets.no_hardcoded_in_src` 등 **실제 finding이 정확히** 잡히는지
      (알려진 상태와 대조: CSP unsafe-inline 존재 → fail로 떠야 정상).
- [ ] 비관리자/미로그인 접근 시 403 (v1 가드 유지 회귀 없음).
- [ ] 시크릿 스캐너가 `.env*`/예제/주석을 오탐하지 않음(제외목록 검증).
- [ ] 외부 네트워크 호출 0건(전 점검 read-only self 확인).

## 9. 리스크 & 완화
| 리스크 | 완화 |
|---|---|
| 정적 휴리스틱 오탐 | 애매 항목은 `warn`, 자동 차단 없음, 사람이 waive/ack |
| 시크릿 스캐너가 실제 시크릿을 리포트에 그대로 노출 | detail에 **마스킹**(앞4·뒤4만) 저장, 원문 미저장 |
| npm audit류 서버리스 타임아웃 | 기존 캐시/warn 패턴 재사용 |
| 스킬 문서의 공격 절차 오용 | 방어 점검만 코드화, 공격 스킬 미참조(코드리뷰로 확인) |

## 10. 승인받을 것 (Open Questions)
1. 신규 점검 ~12종 전부 진행 vs 도메인 우선순위(예: 헤더+시크릿+접근제어 3종 먼저)?
2. `SecurityFinding.domain` 컬럼 추가(마이그레이션 1건) 허용?
3. 시크릿 스캐너 detail 마스킹 정책(앞4·뒤4) 동의?
4. 브랜치/PR 전략 — 기존 보안 WIP은 아직 미커밋 상태. v2는 그 WIP 위에 얹을지, 별도 브랜치로 뺄지?

---
_승인되면 4장 점검팩 → 7장 파일 순서로 구현하고, 8장 기준으로 검증 후 보고합니다._
