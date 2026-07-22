# 관리자 보안·백업 프로그램 — 작업 계획서

> ZEFF AI 관리자 전용 보안 콘솔 및 암호화 백업 시스템  
> 수립일: 2026-07-22 · 상태: **구현 진행**

---

## 1. 목적

| 목표 | 설명 |
|------|------|
| **재해 복구** | Neon DB + Blob 첨부를 **암호화**하여 관리자 **외장 HDD**에 보관 |
| **운영 보안** | 로그인·가입·AI 사용·학습 데이터·실시간 활동을 **관리자만** 열람 |
| **접근 통제** | 비관리자는 `/admin` **진입 시 공홈(`/`)으로 자동 이동**, admin 버튼 **미표시** |

---

## 2. 아키텍처 (하이브리드)

```
┌─────────────────────────────────────────────────────────┐
│  Web: /admin/security/*  (관리자만, 서비스 내부)         │
│  · 보안 대시보드 · 로그 · AI · 학습 · 실시간 · 백업 UI   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS (admin session)
┌──────────────────────────▼──────────────────────────────┐
│  API: /api/admin/security/* , /api/admin/backup/*       │
│  · Prisma 집계 · 감사 로그 · 암호화 백업 스트림           │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Electron (관리자 PC)                                    │
│  · USB/HDD 감지 · 2일마다 자동 백업 · .zeff-backup.enc   │
└─────────────────────────────────────────────────────────┘
```

**웹만으로는 로컬 HDD에 직접 쓸 수 없음** → Electron이 HDD 쓰기·48시간 스케줄 담당.

---

## 3. 접근 통제 (수락된 정책)

| 대상 | 동작 |
|------|------|
| 비로그인 + `/admin` | `/login?callbackUrl=/admin` (관리자 로그인 후 복귀) |
| 로그인 + 비관리자 + `/admin` | **`/` 공홈으로 redirect** (거부 화면 없음) |
| `/api/admin/*` 비관리자 | `403` JSON |
| Header / ProfileMenu | **`session.user.isAdmin === true` 일 때만** admin 링크 |

관리자 판별: [`src/lib/admin.ts`](../src/lib/admin.ts) 이메일 allowlist + JWT `isAdmin`.

---

## 4. 보안 콘솔 메뉴

| 경로 | 기능 |
|------|------|
| `/admin/security` | 요약 대시보드 |
| `/admin/security/auth` | 로그인·가입 (`LoginEvent`) |
| `/admin/security/activity` | `AdminAuditLog` 활동 |
| `/admin/security/ai-usage` | 모델·기능별 AI 사용량 |
| `/admin/security/ai-learning` | Memory, Q&A, RAG chunks 열람 |
| `/admin/security/live` | SSE 실시간 피드 |
| `/admin/security/homepage` | 랜딩·OTP rate limit 상태 |
| `/admin/security/workspace` | 워크스페이스·초대·삭제 정책 |
| `/admin/security/system` | AI kill switch, cron, SystemConfig |
| `/admin/security/backup` | 백업 실행·상태·Electron 연동 |

---

## 5. 백업

### 5.1 포함 데이터

- Postgres: Prisma 모델 전 테이블 JSON export (서버리스에서 `pg_dump` 대체)
- Blob: `LibraryItem`·`ChatHistory` 등 `fileUrl` 목록 + fetch 가능 시 바이너리
- `meta.json`: 버전, 시각, checksum

### 5.2 포맷

- 파일: `YYYY-MM-DD_zeff-backup.enc`
- AES-256-GCM, PBKDF2(비밀번호) — **비밀번호 서버 미저장**
- Electron 또는 웹 다운로드 후 HDD 저장

### 5.3 자동 스케줄 (수락)

- **2일(48시간)마다** Electron이 자동 백업 시도
- 조건: 관리자 로그인 세션 유지 + 이전 HDD 경로 설정됨 + 백업 비밀번호 로컬 keychain(또는 재입력)
- 웹 UI: 마지막 성공 시각, 다음 예정, 실패 사유

---

## 6. 데이터 모델 (추가)

- `AdminAuditLog` — append-only 감사
- `BackupRecord` — 백업 이력(시작/완료/크기/트리거: manual|scheduled)

---

## 7. 구현 단계

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | `/admin` redirect, admin 버튼 숨김, `requireAdmin` | 완료 |
| 1 | `/admin/security` 허브 + API | 완료 |
| 2 | 로그·AI·학습·SSE | 완료 |
| 3 | 백업 API + `BackupRecord` | 완료 |
| 4 | Electron HDD + 48h 스케줄 | 완료 |
| 5 | lint/tsc, 복구 가이드, PR | 진행 |

---

## 8. 복구 (요약)

1. Electron 또는 `scripts/restore-backup.mjs`로 `.zeff-backup.enc` 복호화
2. `database.json` → staging DB import (운영 복구는 별도 절차)
3. `blobs/` → Blob 재업로드

상세: 추후 `docs/ADMIN_BACKUP_RESTORE.md`

---

## 9. 비범위

- SSO/SAML, TOTP 앱, E2E 채팅 암호화
- 일반 사용자용 세션 잠금 (별도 워크스페이스 보안 계획)
- 기존 public Blob 일괄 마이그레이션

---

## 10. 관련 파일

| 영역 | 경로 |
|------|------|
| 계획서 | `docs/ADMIN_SECURITY_BACKUP_PLAN.md` |
| Admin 가드 | `src/lib/requireAdmin.ts`, `src/proxy.ts` |
| 보안 UI | `src/app/admin/security/**` |
| API | `src/app/api/admin/security/**`, `src/app/api/admin/backup/**` |
| 백업 로직 | `src/lib/adminBackup.ts` |
| Electron | `electron/backup.js`, `electron/preload.js` |
