# ZEFF 보안 플랫폼 — 구현 계획서

> Manyfast 유저플로우 6섹션 기반 · `/admin/security`  
> 관련: [ADMIN_SECURITY_BACKUP_PLAN.md](./ADMIN_SECURITY_BACKUP_PLAN.md)

## 6섹션 IA

| 섹션 | 경로 |
|------|------|
| 1. 인증·접속 | `/login`, `/admin/verify` (MFA 8h) |
| 2. 보안 대시보드 | `/admin/security`, `/admin/security/threats` |
| 3. AI 취약점 | `/admin/security/vuln` |
| 4. 실시간 모니터링 | `/admin/security/monitor/*` |
| 5. 예측·분석 | `/admin/security/predict/*` |
| 6. 접근 제어 | `/admin/security/access/*` |

## API

- `POST /api/admin/security/mfa/send|verify`
- `GET|POST /api/admin/security/threats`
- `GET|PATCH /api/admin/security/threats/[id]`
- `GET|POST /api/admin/security/vuln`
- `GET /api/admin/security/events/export`
- `GET|PATCH /api/admin/security/alerts`
- `GET /api/admin/security/predict`
- `GET|POST /api/admin/security/rbac`

## DB (추가)

- `SecurityThreatEvent` — 규칙 기반 위험
- `VulnerabilityScan` — npm audit OSS
- `AdminRoleAssignment` — RBAC

## 배포

```bash
npm run db:push
```

## Phase 2b (예정)

- ZIP 코드 업로드 + LLM 정적 분석
- Manyfast MCP 와이어프레임 UI 동기화
