# PRD: 결제 정식 개시 + 구독 관리(Stripe 포털)

> 상태: 승인 대기 · 2026-07-25 (v2 — 결제 미연동 사실 확인 후 전면 개정)
> 결정: Stripe 호스팅 포털 채택 / 결제수단 탭 삭제 / 몇 주 내 결제 개시

---

## 1. Context

프로덕션 웹훅을 실제로 찔러본 결과 **스텁 모드**였다.

```
POST https://www.zeffai.com/api/stripe/webhook  →  200 {"ok":true,"stub":true}
```

`webhook/route.ts:12-15` 분기다. `STRIPE_SECRET_KEY` 또는 `STRIPE_WEBHOOK_SECRET`이
프로덕션에 없다는 뜻이고, 사용자 확인 결과 **Stripe 연동 자체를 아직 안 했으며 결제 기록도 없다.**

그래서 이 작업은 "해지 기능 추가"가 아니라 **결제를 처음 켜는 작업**이다. 대신 좋은 소식이
있다 — 되찾을 구독이 없으니 **백필이 전혀 필요 없고**, 첫 결제부터 올바르게 설계할 수 있다.
지금이 가장 싼 시점이다.

### 1-1. 지금 사실과 어긋나는 것들

| # | 문제 | 위치 |
|---|---|---|
| 1 | 랜딩·설정에서 **살 수 없는 유료 플랜을 판다**. 결제 누르면 503 "결제 시스템 점검 중입니다" | `Pricing.tsx:57-58`, `SettingsModal.tsx` PlanPanel, `checkout/route.ts:55-60` |
| 2 | 결제수단 탭이 **Stripe와 무관한 장식**(브랜드+뒤 4자리만 자체 DB 저장) | `api/billing/methods/route.ts:9` |
| 3 | 그런데 ko/en 안내문만 **"실제 결제는 Stripe로 처리되며"** — 사실과 다름 | `i18n.ts:267`, `:749` |
| 4 | 약관 제12조가 "설정에서 언제든 해지 가능"을 명시 — 해당 UI 없음 | `legalContent.ts:120-124` |

### 1-2. 🔴 출시 전 반드시 잡아야 할 버그 — 이중 구독

`checkout/route.ts`에 **이미 구독 중인지 확인하는 코드가 없다.** 항상 새 Checkout Session을
`mode: "subscription"`으로 만든다.

→ Pro 사용자가 Professional 결제하기를 누르면 **구독이 2개가 되고 매달 두 번 청구된다.**
지금은 결제가 꺼져 있어 드러나지 않을 뿐, 키를 넣는 순간 살아나는 버그다.

같은 이유로 Customer도 매번 새로 생긴다(`customer_email`만 전달, `customer` 미전달).

---

## 2. 설계 결정

### 2-1. Price 객체를 만든다 (현재는 `price_data` 인라인)

현재 `checkout/route.ts:98-110`은 결제할 때마다 가격을 즉석에서 만든다. 이러면
**포털의 플랜 변경 기능을 쓸 수 없다** — Stripe가 "바꿀 수 있는 다른 가격"을 모르기 때문.

Price 객체 4개(Pro 월/연, Professional 월/연)를 만들어 두면:
- 포털에서 **업그레이드·다운그레이드·해지가 전부** 처리된다
- 이중 구독 문제가 구조적으로 사라진다 — 플랜 변경은 체크아웃이 아니라 기존 구독 수정이 된다
- 매출 리포트가 Stripe에서 플랜별로 집계된다

### 2-2. 체크아웃은 "첫 구독"만, 그 뒤는 전부 포털

| 사용자 상태 | 경로 |
|---|---|
| 무료 → 유료 | 기존 Checkout (신규 구독 생성) |
| 유료 → 다른 유료 | **포털** (구독 수정) |
| 유료 → 무료 | **포털** (해지) |

`checkout/route.ts`에 활성 구독 가드를 넣어, 구독 중이면 세션을 만들지 않고 포털로 돌린다.
이게 이중 구독을 막는 지점이다.

---

## 3. 작업

### Phase 0 — Stripe 대시보드 【사용자 작업】

코드로 할 수 없는 부분. 이게 끝나야 나머지가 검증된다.

- [ ] 테스트 모드 키 발급 → Vercel 환경변수 `STRIPE_SECRET_KEY` (Preview 스코프)
- [ ] Product 2개(Pro, Professional) + Price 4개(각 월/연) 생성 → Price ID 4개 확보
- [ ] 웹훅 엔드포인트 등록: `https://www.zeffai.com/api/stripe/webhook`
      이벤트: `checkout.session.completed`, `customer.subscription.updated`,
      `customer.subscription.deleted` → 서명 시크릿을 `STRIPE_WEBHOOK_SECRET`에
- [ ] 고객 포털 설정 — **해지 + 플랜 변경 + 영수증만** 노출 (결제수단 변경은 선택)
- [ ] 테스트 검증 완료 후 라이브 키로 교체 (Production 스코프)

### Phase 1 — 결제 파이프라인 정상화 【코드】

- **A. Price ID 사용** — `price_data` 인라인 → `price: <ID>`.
  플랜×주기 → Price ID 매핑을 env 4개로 받는다 (`plans.ts`에 매핑 추가)
- **B. Customer 재사용** — `UserSettings.stripeCustomerId`가 있으면 `customer`로 전달,
  없으면 `customer_email`. 컬럼은 이미 있고 코드 참조만 0건이었다
- **C. Customer ID 저장** — `fulfillPaidOrder`(`billing.ts`)에 넣는다.
  웹훅과 confirm 두 경로가 모두 여길 지나므로 **한 곳만 고치면 양쪽이 해결**된다
- **D. 이중 구독 가드** — 활성 구독이 있으면 체크아웃 대신 포털 안내
- **E. 웹훅 확장** — `customer.subscription.deleted` → `plan: "free"`.
  `stripeCustomerId`를 조회 키로 쓰므로 **`@unique` 부여**
- **F. 스텁 모드 안전장치** 🔴 — 지금은 시크릿이 없으면 **200을 반환한다.**
  Stripe는 200을 "배달 완료"로 보고 재시도하지 않으므로 **결제 이벤트가 영구 소실**된다.
  프로덕션에서는 500 + 에러 로그로 바꿔 Stripe가 재시도하게 한다
- **G. apiVersion 고정** — 현재 미지정(SDK 기본값). SDK 업그레이드 시 무언 변경 방지

> 마이그레이션 파일 불필요 — 이 프로젝트는 `prisma db push` 방식이고 `prisma/migrations/`가 없다.
> 빌드 시 `scripts/db-push-retry.mjs`가 반영한다.

### Phase 2 — 구독 관리 UI

- `POST /api/billing/portal` — `billingPortal.sessions.create({ customer, return_url })`.
  `return_url`은 기존 `getBaseUrl()`(`stripe.ts:22`) 재사용
- 설정 `요금제` 탭에 "구독 관리" 버튼 (유료 플랜일 때만)
- 하위 등급 카드의 비활성 "다운그레이드"(PR #48에서 넣은 것) → 포털 안내로 교체

### Phase 3 — 삭제 【사용자 승인 완료】

결제수단 탭을 지운다. 지금 데이터가 사실상 없어 가장 싼 시점이고, 포털이 이 역할을 대체한다.

- `SavedPaymentMethod` 모델, `api/billing/methods/` 라우트, 설정 UI
- 딸려 나가는 데드엔드: `billing.cancelPlanFirst`("먼저 요금제를 무료로 변경해 주세요"인데
  그 경로가 없던 순환), 사실과 다른 `billing.methodsHint`
- `api/billing/orders`(주문 내역)는 **남긴다** — 포털 영수증과 별개로 자체 이력 표시

---

## 4. 영향 파일

| 파일 | 변경 |
|---|---|
| `prisma/schema.prisma` | `stripeCustomerId @unique`, `SavedPaymentMethod` 삭제 |
| `src/lib/plans.ts` | Price ID 매핑 |
| `src/lib/stripe.ts` | apiVersion 고정 |
| `src/lib/billing.ts` | customer ID 저장 (웹훅·confirm 공통) |
| `src/app/api/checkout/route.ts` | Price ID, customer 재사용, 이중 구독 가드 |
| `src/app/api/stripe/webhook/route.ts` | 구독 해지 처리, 스텁 200 → 500 |
| `src/app/api/billing/portal/route.ts` | **신규** |
| `src/app/api/billing/methods/route.ts` | **삭제** |
| `src/components/SettingsModal.tsx` | 구독 관리 버튼, 결제수단 탭 제거 |
| `src/lib/i18n.ts` | 문구 정리·삭제 (8개 언어) |

---

## 5. 검증

**정적**: `tsc --noEmit` · `eslint` · `next build`

**Stripe 테스트 모드** (Phase 0 완료 후, 실제 돈 없이)
- [ ] 무료 → Pro 결제 → `stripeCustomerId`가 채워지는지
- [ ] **같은 사용자 재결제 시 Customer가 새로 생기지 않는지**
- [ ] 🔴 **Pro 상태에서 Professional 결제 시도 → 구독이 2개가 되지 않는지** (§1-2)
- [ ] 포털 진입 → 해지 → `customer.subscription.deleted` 수신 → `plan`이 `free`로
- [ ] 해지 예약 후 기간 만료 전까지 유료 기능 유지 (약관 제12조 ②)
- [ ] 웹훅 시크릿을 일부러 비우고 → **500이 반환되고 Stripe가 재시도하는지** (F)

**라이브 전환 전**
- [ ] 라이브 모드 Price 객체·웹훅 엔드포인트·포털 설정을 **따로 다시** 만들었는지
      (테스트/라이브는 완전히 분리된 공간이다 — 가장 흔한 출시 사고)

---

## 6. 리스크

| 리스크 | 완화 |
|---|---|
| 테스트에서 되던 게 라이브에서 안 됨 | 라이브 키 교체 후 **소액 실결제 1건**으로 전 구간 확인 후 환불 |
| 포털 해지 후 웹훅 누락 | F(500 반환)로 Stripe 자동 재시도 확보 + 관리자 화면에서 수동 교정 가능 |
| 결제수단 탭 삭제에 사용자 데이터가 있음 | 삭제 전 건수 확인. 있으면 사용자에게 보고 후 진행 |
| Price ID env 누락으로 결제 실패 | 부팅 시점 검증 대신 체크아웃에서 명확한 에러 + 기존 보안 자가점검에 항목 추가 |

---

## 7. 범위 밖

- 7일 환불 자동화(약관 제11조 ②) — 포털/대시보드에서 수동
- 쿠폰·프로모션 코드
- 세금(VAT) 처리 — Stripe Tax 별도 검토
