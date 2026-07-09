# AI 툴킷 — 진행 상황 기록

> 다음 작업 세션은 이 문서부터 읽고 이어서 진행할 것. 새 세션 시작 시 최신 git 상태(`git log`, `git status`)와 이 문서 내용이 다르면 git 쪽을 신뢰할 것.

## 프로젝트 개요

- **레포**: `angelsj913/Kx` (GitHub)
- **브랜치**: `claude/program-display-devices-xb166t`
- **스택**: Next.js 16.2.10(실제 최신 버전, 학습 데이터의 관행과 다른 부분 있음 — 아래 "Next.js 16 주의사항" 참고) + React 19 + Prisma 7.8.0 + NextAuth(Auth.js) v5 + Tailwind
- **배포**: Vercel (`kx-chi.vercel.app`) + Electron 데스크톱 패키징 병행
- **제품 정체성**: "AI 툴킷" — 학생/직장인 모드 전환이 되는 AI 데스크톱 앱. 문서 생성 도구(PPT/엑셀/영상요약/음성정리)와 멀티모달 AI 채팅을 제공.

## 지금까지 완료한 것

### 1. 초기 버그 수정
- `global-error.tsx`에 `'use client'` 누락 + prop 이름 오류로 전체 페이지 500 에러 나던 것 수정.

### 2. 홈페이지(`/`)
- 다운로드 버튼 → OS 선택 모달, "사용 방법" 3단계 가이드, FAQ 섹션 추가.
- 관련 컴포넌트: `src/components/landing/DownloadCta.tsx`, `HowItWorks.tsx`, `Faq.tsx`.

### 3. 앱 내부 전면 개편 — 학생/직장인 모드
- 앱 좌측 상단에 학생 ⇄ 직장인 모드 스위치 (`src/components/ModeSwitch.tsx`, `src/lib/appMode.ts`).
- 도구 레지스트리 패턴: `src/lib/tools.ts`의 `TOOLS: ToolDef[]` 배열. 각 도구는 `id, appMode(student|office|common), label, title, description, icon, inputType(text|url|audio|chat), outputType(markdown|pptx|xlsx), systemInstruction, placeholder, submitLabel, fileBaseName, short` 필드를 가짐. `toolsForMode(mode)` / `getTool(id)`로 조회.
- 직장인 도구: 비즈니스 문서/PPT/엑셀 생성.
- 학생 도구: 강의 영상 요약(YouTube URL), 수업 음성 녹음 정리, 발표자료 작성.
- 공통(common) 도구: AI 채팅.
- PPT/엑셀 생성: `src/lib/pptx.ts`(`parseDeck`/`buildPptxBase64`), `src/lib/xlsx.ts`(`parseWorkbook`/`buildXlsxBase64`).

### 4. AI 채팅 (멀티턴 + 첨부 + 페르소나)
- `src/components/AiChat.tsx` — 대화형 UI, 이미지/PDF 첨부, 페르소나 선택(`src/lib/personas.ts`, 5종: 만능비서/튜터/컨설턴트/창의파트너/코딩도우미).

### 5. 대전환 — 계정 시스템 + 클라우드 동기화 (가장 최근 작업, 완료됨)

사용자가 명시적으로 요구한 3가지 규칙:
1. **AI를 여러 개 나열해서 고르게 하지 않는다.** 뒤에서 자동으로 "짬뽕"(순서대로 시도 → 실패 시 다음 모델로 자동 전환).
2. **API 키를 사용자가 직접 입력하지 않는다.** 로그인만 하면 끝 — 서버가 자기 키로 대신 호출.
3. **API 키 관련 문구/화면 전부 제거.** "API 키 설정" 대신 "내 계정" 화면에서 로그인 상태만 확인.

추가로 사용자가 정의한 필수 사용자 흐름(9단계): 다운로드 → 설치 → 실행 → **구글 로그인** → AI 사용 → 로그아웃 → **다른 기기에서 같은 계정 로그인** → **이전 채팅/생성 파일을 그대로 이어서 사용**. → **localStorage 방식을 버리고 실제 클라우드 DB + 클라우드 파일 저장소로 완전 전환**해야 함.

**구현된 아키텍처:**
- **인증**: NextAuth(Auth.js) v5, Google 프로바이더, JWT 세션. `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`.
- **라우트 보호**: `src/proxy.ts` (Next 16에서 `middleware.ts`가 아니라 **`proxy.ts`**, 함수명도 `proxy`) — `/app/:path*`를 로그인 여부로 게이트, 미로그인 시 `/login`으로 리다이렉트.
- **로그인 페이지**: `src/app/login/page.tsx` — "구글로 로그인" 버튼, "Apple로 로그인 (준비 중)" 비활성 버튼.
- **앱 레이아웃**: `src/app/app/layout.tsx` — 서버에서 `auth()` 재확인 + `SessionProvider` 래핑.
- **DB**: Neon(서버리스 Postgres) + Prisma 7. `prisma/schema.prisma`, `prisma.config.ts`(Prisma 7은 `datasource.url`을 스키마에 못 씀 — CLI용 설정은 `prisma.config.ts`로, 런타임 연결은 드라이버 어댑터로), `src/lib/prisma.ts`(Neon 어댑터로 `PrismaClient` 생성).
- **파일 저장**: Vercel Blob (`@vercel/blob`의 `put()`) — 생성된 PPT/엑셀, 채팅 첨부파일을 여기 올리고 URL만 DB에 저장.
- **AI 모델 자동 전환**: `src/lib/models.ts`(`FALLBACK_MODELS` 5개: Gemini Flash/Pro → OpenRouter 무료 모델 3종, `MULTIMODAL_MODELS`는 Gemini만), `src/lib/ai.ts`(`generateWithFallback()`, `chatReplyWithFallback()`, `isRetryableProviderError()`로 실패 시 다음 모델로 자동 이동). 사용자에게 모델명 절대 노출 안 함.
- **데이터 모델** (`prisma/schema.prisma`): NextAuth 어댑터 필수 모델(`User/Account/Session/VerificationToken`, 필드명 고정) + 앱 전용 `HistoryItem`(도구 생성 결과 + `fileUrl`/`fileName`), `ChatConversation`(유저·페르소나·제목), `ChatMessage`(role/text/attachments JSON).
- **API 라우트** (전부 `auth()`로 로그인 확인, 401 처리):
  - `src/app/api/generate/route.ts` — AI 생성 → Blob 업로드(pptx/xlsx) → `HistoryItem` 저장.
  - `src/app/api/history/route.ts`(GET 목록/DELETE 전체), `src/app/api/history/[id]/route.ts`(DELETE 단건).
  - `src/app/api/chat/conversations/route.ts`(GET 목록/POST 새 대화), `.../[id]/route.ts`(GET 메시지 포함 조회/DELETE), `.../[id]/messages/route.ts`(POST — 첨부 Blob 업로드 → 사용자 메시지 저장 → AI 호출 → AI 메시지 저장 → 대화 제목/`updatedAt` 갱신).
- **UI 갱신**:
  - `src/components/Account.tsx`(신규) — 로그인 계정 표시 + 로그아웃, API 키 문구 전무.
  - `src/components/Sidebar.tsx` — "API 키 설정" → "내 계정"(`UserRound` 아이콘).
  - `src/lib/history.ts` — localStorage 훅 → 서버 fetch 기반 `useHistory()`.
  - `src/components/HistoryView.tsx`, `src/components/GeneratorView.tsx`, `src/components/FileResultPanel.tsx`, `src/app/app/page.tsx` — 새 서버 기반 데이터 흐름에 맞게 전부 갱신. 히스토리의 pptx/xlsx 항목은 `fileUrl`로 재다운로드 가능.
  - `src/components/AiChat.tsx` — 대화 목록 패널(생성/전환/삭제) 추가, 메시지가 DB에 저장·복원됨, 페르소나 변경 시 새 대화로 시작.
  - **삭제된 파일**: `src/lib/apiKeys.ts`, `src/components/ModelSelect.tsx`, `src/components/Settings.tsx`, `src/app/api/chat/route.ts`(→ conversations 라우트로 대체).

**중요 기술 메모 (다음 세션에서 다시 겪을 수 있는 함정들):**
- Next.js 16: `middleware.ts` 아니라 `src/proxy.ts` + `export function proxy`. Node.js 런타임 고정(Edge 불가, deprecated 경로 제외).
- Prisma 7: `generator client { provider = "prisma-client", output = "../src/generated/prisma" }` 필수(명시적 output 없으면 에러). `datasource { url = ... }` 스키마에 쓰면 **P1012 에러** — `prisma.config.ts` + 런타임 어댑터(`PrismaNeon`)로 분리해야 함.
- `react-hooks` 플러그인 v7의 새 규칙 `set-state-in-effect`: `useEffect` 안에서 `useCallback`으로 만든 함수(내부에서 setState 호출)를 직접 호출하면 lint 에러. **해결책**: `useEffect` 안에서 인라인 async IIFE로 fetch+setState를 직접 하고(`(async () => { ...; setX(...); })()`), 이벤트 핸들러에서 쓸 `refetch` 류 함수는 별도 `useCallback`으로 유지. 마운트 시 자동 조회와 사용자 액션에 의한 재조회를 분리해서 처리함(`src/lib/history.ts`, `src/components/AiChat.tsx`, `src/app/app/page.tsx`의 `handleNavigate` 참고).

**검증 완료 (이 세션에서 실제로 확인됨):**
- `npx prisma validate` / `npx prisma generate` ✅
- `npx tsc --noEmit` ✅ (에러 0개)
- `npm run lint` ✅ (에러 0개)
- `npm run build` (Turbopack) ✅ 성공

**이 세션에서 검증 불가능했던 것** (실제 키가 있는 환경에서 확인 필요): 진짜 구글 로그인 동작, 실제 DB 읽기/쓰기, Blob 업로드, 기기 간 동기화 시나리오 자체.

## 현재 git 상태 — ⚠️ 푸시 안 됨, 주의 필요

- 마지막 커밋: `b79e387` "구글 로그인 + 클라우드 DB/파일 저장소로 전환" (로컬에만 존재, 브랜치 `claude/program-display-devices-xb166t`)
- **원격(GitHub)에 아직 푸시되지 않음.** 이 세션에서 `git push`(로컬 git 프록시 403)와 GitHub MCP `push_files`/`create_branch`(403 Resource not accessible by integration) 둘 다 쓰기 권한 거부로 실패함. 읽기(`git ls-remote`, `list_branches`)는 정상 동작 — 즉 쓰기 권한만 없는 상태.
- 사용자에게 확인한 결과: **"나중에 다시 시도"**로 결정. 다음 세션 시작 시 가장 먼저 할 일:
  1. `git status`/`git log`로 로컬에 이 커밋이 여전히 있는지 확인 (컨테이너가 재활용됐으면 사라졌을 수 있음 — 그 경우 이 문서와 GitHub 원격 `main`을 기준으로 처음부터 다시 구현해야 함).
  2. 있다면 `git push -u origin claude/program-display-devices-xb166t` 재시도. 안 되면 GitHub MCP `push_files`로 재시도.
  3. 그래도 403이면 사용자에게 GitHub App(레포 `angelsj913/Kx`)의 쓰기 권한 상태를 확인해달라고 요청.
- 원격 `main`은 이 브랜치보다 훨씬 뒤처져 있음 (이번 세션 작업 이전의 여러 단계가 원격에 없음 — 학생/직장인 모드, AI 채팅 등도 포함해서 46개 파일 diff).

## 앞으로 할 일 (우선순위 순)

1. **[최우선] 푸시 완료** — 위 "현재 git 상태" 참고. 이게 안 되면 이 세션의 모든 작업이 컨테이너와 함께 사라질 위험이 있음.
2. **실제 크리덴셜 설정 (사용자가 집에서 진행)** — 아래 "환경변수" 표 참고. `AUTH_GOOGLE_ID`/`SECRET`(Google Cloud Console), `DATABASE_URL`(Neon 프로젝트 생성), `BLOB_READ_WRITE_TOKEN`(Vercel Blob), `AUTH_SECRET`, `GEMINI_API_KEY`/`OPENROUTER_API_KEY`.
3. **실제 동작 검증** — 크리덴셜 설정 후: 구글 로그인 → AI 채팅/생성 → 로그아웃 → 다른 기기에서 같은 계정 로그인 → 히스토리/채팅 이어보기 전체 시나리오를 실제로 테스트.
4. **Electron 데스크톱 앱과 클라우드 연동** (이번 작업 범위 밖으로 명시적으로 미뤄둔 것):
   - 현재 Electron 앱은 설치본마다 자기만의 로컬 서버를 띄우는 구조 → 기기 간 동기화와 근본적으로 안 맞음. 배포된 클라우드 API(Vercel)를 바라보도록 변경 필요.
   - Google OAuth는 Electron `BrowserWindow` 안에서 막힘(`disallowed_useragent`) → 시스템 기본 브라우저로 열어서 처리(`shell.openExternal` + 커스텀 프로토콜 또는 loopback 리다이렉트 방식) 구현 필요.
5. **마이그레이션(`prisma migrate`) 실행** — 지금까지는 `prisma validate`/`generate`만 했고, 실제 Neon DB에 스키마를 반영하는 `prisma migrate dev`(또는 `deploy`)는 실행한 적 없음(로컬에 placeholder `DATABASE_URL`만 있었음). 진짜 DB 연결 후 필요.
6. **Vercel 환경변수 등록** — 배포 환경(Vercel 프로젝트 설정)에 위 환경변수들을 실제로 등록해야 배포본에서 로그인/DB/Blob이 동작함.

## 환경변수 (전부 사용자가 나중에 직접 설정 — 이 세션엔 실제 키 없음)

| 변수 | 용도 |
|---|---|
| `AUTH_SECRET` | NextAuth 세션/쿠키 서명 |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | 구글 OAuth (Google Cloud Console에서 발급) |
| `DATABASE_URL` | Neon Postgres 연결 문자열 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 업로드 권한 |
| `GEMINI_API_KEY` | Gemini 모델 호출용 (서버 전용, 유일한 AI 키 소스 중 하나) |
| `OPENROUTER_API_KEY` | OpenRouter 무료 모델 폴백용 |

## 주요 파일 위치 요약

```
src/lib/tools.ts              도구 레지스트리
src/lib/appMode.ts             학생/직장인 모드 상태
src/lib/models.ts              AI 모델 자동 전환 순서 (사용자에게 비노출)
src/lib/ai.ts                  generateWithFallback / chatReplyWithFallback
src/lib/gemini.ts, openrouter.ts  프로바이더별 실제 호출 구현
src/lib/prisma.ts              Prisma 클라이언트 싱글턴 (Neon 어댑터)
src/lib/history.ts             히스토리 fetch 훅 (useHistory)
src/lib/personas.ts            채팅 페르소나 5종
src/auth.ts                    NextAuth 설정
src/proxy.ts                   /app 라우트 로그인 게이트
prisma/schema.prisma           DB 스키마
prisma.config.ts               Prisma CLI 설정
src/app/app/page.tsx           앱 메인 워크스페이스
src/components/AiChat.tsx      AI 채팅 (대화 목록/영속화)
src/components/Account.tsx     내 계정 화면
src/components/GeneratorView.tsx / HistoryView.tsx / FileResultPanel.tsx  도구 생성/히스토리 UI
src/app/api/generate/route.ts               도구 생성 API
src/app/api/history/**                      히스토리 API
src/app/api/chat/conversations/**           채팅 대화 API
src/app/api/auth/[...nextauth]/route.ts     NextAuth 핸들러
```

## 참고 — "이 Next.js는 학습 데이터와 다르다" (AGENTS.md 지침)

이 프로젝트는 Next.js 16.2.10 정식 버전이며, 학습 데이터의 관행과 실제로 다른 부분이 있으니 새 기능을 짤 때는 `node_modules/next/dist/docs/`의 관련 가이드를 먼저 확인할 것. 이번 세션에서 확인된 대표 사례: `proxy.ts` 네이밍, `error.tsx`/`global-error.tsx`의 `unstable_retry` 콜백, ESLint `eslint-config-next` flat config 전환.
