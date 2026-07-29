# 로그인 속도 개선 PRD

> Part 4-B — 승인 후 구현.

## 현황 (병목 후보)

| 구간 | 설명 |
|------|------|
| DB cold start | Supabase Postgres Transaction Pooler, 최대 15s timeout |
| verifyOtp | credentials 로그인 시 DB 조회 |
| session.update | JWT updateAge 24h |
| Vercel cold start | serverless 함수 첫 호출 |

## 목표

- P95 로그인 완료 시간 < 3s (warm path)
- cold start 시 명확한 로딩 UI (이미 login 페이지 spinner)

## 제안 작업

1. **Connection pool warm-up** — `/api/health` cron 또는 middleware에서 idle ping
2. **로그인 경로 최소화** — 불필요한 `session.update()` 호출 제거 검토
3. **Edge-compatible auth checks** — 정적 페이지는 session 없이 렌더
4. **측정** — Speed Insights + 서버 타이밍 로그 (`login_duration_ms`)

## 수용 기준

- staging에서 10회 연속 로그인 P95 < 3s
- cold start 1회는 8s 이내 + 사용자-facing progress 표시

## 리스크

- Pooler connection limit — warm-up 빈도 조절 필요
