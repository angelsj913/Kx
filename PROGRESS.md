# AI 툴킷 — 진행 상황 기록

> 다음 작업 세션은 이 문서부터 읽고 이어서 진행할 것. 새 세션 시작 시 최신 git 상태(`git log`, `git status`)와 이 문서 내용이 다르면 git 쪽을 신뢰할 것.

---

## 🆕 ZEFF 4대 기능 통합 (2026-07-12~, 브랜치 `claude/work-continuation-v7r7v2`)

별도 Python 백엔드 없이 **Kx 자체(Next.js API + Prisma) 안에** ZEFF의 4대 기능을 엔진으로 구현하는 트랙. 우선순위 순서:

1. **팀 워크스페이스** — ✅ 완료 (아래)
2. **음성 대화 모드** (STT/TTS) — 예정
3. **자동 복습 스케줄러** (SM-2/FSRS) — 예정
4. **기업용 데이터 커넥터 / RAG** — 예정

### ✅ Feature 1 — 팀 워크스페이스 (여러 명이 같은 세션·서재 공유)

**DB (prisma/schema.prisma):**
- 신규 모델 `Workspace`, `WorkspaceMember`(역할 owner/admin/member), `WorkspaceInvite`(토큰·만료·수락).
- `ChatSession`·`LibraryItem`에 `workspaceId String?` 추가(+ 인덱스). null=개인, 값=공유. 워크스페이스 삭제 시 `SetNull`이라 항목 자체는 보존됨.
- ⚠️ **배포 전 필수**: Neon DB에 스키마 반영 필요 → `DATABASE_URL=... npx prisma db push` (이 프로젝트는 마이그레이션 히스토리 없이 db push 방식).

**서버 엔진 (`src/lib/workspace.ts`):** 역할 위계, `getMyWorkspaces`, `requireMembership`/`requireRole`, `resolveScope`(요청의 `X-Workspace-Id` 헤더/`?workspace=` 검증), `listWhere`(목록 스코프), `itemAccessWhere`(단일 항목 접근: 내 것 OR 내 워크스페이스 공유분), `createWorkspace`, 초대 토큰.

**API 라우트 (`src/app/api/workspaces/`):** `GET/POST /workspaces`, `GET/PATCH/DELETE /workspaces/[id]`(상세+멤버), `GET/POST /workspaces/[id]/invites`, `DELETE /workspaces/[id]/members/[memberId]`(제거/나가기), `GET/POST /workspaces/invites/[token]`(미리보기/수락). 기존 chat/library 라우트를 스코프-인지로 배선(목록·생성·단일접근·삭제 권한).

**클라이언트 (`src/lib/workspaceClient.tsx`):** `WorkspaceProvider`(app/layout에 주입) + `useWorkspace()` + `wsFetch`(활성 워크스페이스 헤더 자동 첨부, localStorage 보관). `useSessions`/`LibraryView`/`ChatWorkspace`가 활성 스코프 전환 시 자동 리페치.

**UI:** 사이드바 상단 `WorkspaceSwitcher`(개인↔워크스페이스 전환, 생성), `WorkspaceModal`(멤버 목록·초대 링크 발급·역할·제거·나가기/삭제), `/invite/[token]` 수락 페이지.

**검증:** `tsc`/`eslint`/`next build` 통과. 추가로 **로컬 Postgres 16에 `prisma db push` 성공 + 3사용자(alice/bob/carol) 시나리오 통합테스트 12/12 통과**(스코프 격리, 멤버 가시성, 비멤버 차단, 역할별 삭제권한, cascade/SetNull). 테스트는 `--no-save` 의존성으로 실행해 repo deps에는 영향 없음.

---

## 프로젝트 개요

- **레포**: `angelsj913/Kx` (GitHub)
- **현재 브랜치**: `claude/memory-sync-intent-ib4fj5` (원격에 푸시 완료, 최신 상태 — `claude/memory-sync-verify-0bfkhh`를 fast-forward로 흡수한 뒤 이어서 작업 중)
- **스택**: Next.js 16.2.10(학습 데이터의 관행과 다른 부분 있음 — 문서 맨 아래 "Next.js 16 주의사항" 참고) + React 19 + Prisma 7.8.0 + NextAuth(Auth.js) v5 + Tailwind v4 + Framer Motion
- **배포**: Vercel (프로젝트명 `kx`, 팀 `kxeung9`) + Electron 데스크톱 패키징 병행
- **제품 정체성**: "AI 툴킷" — 학생/직장인 모드 전환이 되는 AI 데스크톱 앱. 문서 생성 도구(PPT/엑셀/회의록/주간보고/강의노트/레포트 초안)와 멀티모달 AI 채팅을 제공.

### Vercel 배포 정보 (다음 세션에서 바로 쓸 수 있도록)

- Team ID: `team_KALrXzBWXc0zZLIvJypErTaJ` (slug `kxeung9`)
- Project ID: `prj_65xyEfqWHdlZLz6oXeQOmqVYz4mm` (name `kx`)
- 이 브랜치 preview 고정 URL(브랜치 alias, 매 푸시마다 자동 갱신됨): `https://kx-git-claude-memory-sync-verify-0bfkhh-kxeung9.vercel.app/`
- 프로덕션 도메인(`kx-chi.vercel.app`)은 **아직 옛날 버전**(로그인/클라우드 동기화 이전 커밋)을 서빙 중 — 이 브랜치가 `main`에 머지/승격되기 전까지는 그대로임.
- Preview 배포는 Vercel Deployment Protection(SSO)에 걸려 있어 링크 접근 시 403이 뜰 수 있음 → `get_access_to_vercel_url` MCP 툴로 `_vercel_share` 우회 링크 발급 가능(24시간 유효).

## 지금까지 완료한 것 (이번 세션 기준, 최신순 아님 — 진행 순서대로)

### 1. 클라우드 동기화 백엔드 복구 확인 + 브랜치 정합화
- 이전 세션이 "푸시 실패해서 유실됐을 수 있다"고 걱정했던 로그인/DB/Blob 작업(`claude/program-display-devices-xb166t` 브랜치)이 실제로는 GitHub에 정상적으로 올라가 있었음을 확인.
- 당시 작업 배정 브랜치(`claude/memory-sync-verify-0bfkhh`)는 그 작업이 반영되기 전의 옛날 `main`에서 갈라져 나온 상태였음 → `git fetch` + `git checkout -B`로 `claude/program-display-devices-xb166t` 최신 커밋 위로 재설정한 뒤 이어서 작업.

### 2. 랜딩페이지(`/`) 카피 및 UI 개선
- "사용 방법" 1단계, 기능 카드 2개("로컬 히스토리 보관함"→"끊김 없는 작업 흐름", "안전한 데스크톱 실행"→"세팅 대신 몰입"), FAQ 회원가입 문항을 로그인/클라우드 동기화 흐름에 맞는 프리미엄 카피로 교체.
- 직장인 모드 기능 카드에 호버 시 상세 설명이 부드럽게 펼쳐지는 인터랙션 추가.
- 헤더에 UI 전용 "Support" 버튼(클릭 시 아무 동작 없음) + "로그인" 링크(`/login`으로 이동) 추가.
- `/login`에 실제 구글 로그인 버튼은 그대로 두고, 이메일/비밀번호 입력 필드 + 아이디·비밀번호 찾기 링크를 목업(비활성)으로 추가.
- **미해결로 남겨둔 것**: FAQ의 "제가 입력한 내용이 밖으로 새어나가지 않나요?" 항목이 여전히 "로컬 처리" 문구라 실제 클라우드 동기화 동작과 어긋남 — 교체할 정확한 카피를 받지 못해 그대로 둠. 다음에 카피를 받으면 `src/components/landing/Faq.tsx` 두 번째 항목만 고치면 됨.

### 3. AI 모델 인벤토리 점검 (구현만, 실제 키 상태는 미확인)
- `src/lib/models.ts`의 `FALLBACK_MODELS` 5개(Gemini 2.5 Flash/Pro → OpenRouter Llama/DeepSeek/Qwen 무료 모델)가 전부 코드상 완전히 연동되어 있음을 확인.
- 이 샌드박스에도, (당시 확인 가능한 범위에서) Vercel 프로젝트에도 `GEMINI_API_KEY`/`OPENROUTER_API_KEY`가 설정되어 있는지 여부는 **확인할 방법이 없었음**(Vercel MCP에 환경변수 조회 툴 없음) — 사용자가 Vercel 대시보드에서 직접 확인 필요.

### 4. Vercel 배포 실패 버그 수정
- 모든 브랜치의 Vercel 빌드가 `Can't resolve '@/generated/prisma/client'`로 계속 실패하고 있었음(이전 세션들도 겪었지만 원인 파악 못 함).
- 원인: `package.json`에 `postinstall` 훅이 없어서, 로컬에서는 수동으로 `npx prisma generate`를 먼저 돌렸기 때문에 못 봤던 문제였음. Vercel은 `npm install` → `npm run build`만 실행하므로 Prisma 클라이언트가 아예 생성되지 않았음.
- **수정**: `package.json`에 `"postinstall": "prisma generate"` 추가. 이후 배포부터 정상적으로 `READY` 상태로 빌드됨.

### 5. `/app` 워크스페이스 듀얼 모드 전면 개편 (이번 세션에서 가장 큰 작업)
사용자가 요청한 "Epic" 스펙 전체 구현:

- **인증 게이트**: 기존에 이미 `src/proxy.ts`(엣지 미들웨어) + `src/app/app/layout.tsx`(서버 재확인) 이중으로 완전히 구현되어 있었음 — 재작업 없이 그대로 유지.
- **신규 구조화 도구 4종** (`src/lib/structured.ts`에 타입/파서, `src/lib/tools.ts`에 도구 정의 추가):
  - **회의록**(office) — 날짜/참석자/안건 메타데이터 + 액션 아이템(담당자 + 달력 date-picker)
  - **주간 업무 보고**(office) — 이번 주/다음 주 2단 레이아웃 + 드래그 가능한 진행률 슬라이더
  - **강의 요약 노트**(student) — 핵심개념·큐(좌) / 강의 필기(우) 능동회상 2단 레이아웃 + 하단 고정 3줄 요약 박스
  - **레포트·논문 초안**(student) — 클릭 시 스크롤되는 아웃라인 사이드바 + 섹션 편집 + 참고자료 표 + 실시간 글자 수
  - `ToolDef`에 `outputType: "structured"` 값과 `structuredKind` 필드 추가. 기존 markdown/pptx/xlsx 도구는 전혀 건드리지 않음(순수 추가).
- **자동 저장**: `src/lib/useAutosave.ts`(디바운스 훅) + `PATCH /api/history/[id]` 라우트 신규 추가. 저장 중일 때만 "저장 중..." 표시, 평소엔 아무것도 안 보임.
- **모드별 테마**: `src/lib/theme.ts` — 직장인 모드 `#0F172A`(배경)/`#38BDF8`(포인트), 학생 모드 `#1E1B4B`/`#C084FC`. CSS 커스텀 프로퍼티(`--mode-bg`, `--mode-accent`, `--mode-accent-deep`)로 `AppWorkspace` 루트에 주입 → Sidebar/ModeSwitch/Dashboard/GeneratorView/ResultPanel/FileResultPanel/HistoryView 전체에 `transition-colors duration-500`로 적용. AiChat/Account/AudioInput은 범위 밖으로 의도적으로 제외(공통 도구라 모드 색상 안 씀).
- **전환 애니메이션**: Framer Motion `AnimatePresence`로 모드·도구 전환 시 콘텐츠 페이드 처리(`src/app/app/page.tsx`).
- **검증**: `tsc --noEmit` / `lint` / `build` 전부 통과. 실제 브라우저(headless Chromium)로 로그인 게이트를 **로컬에서만 임시로** 우회해서(커밋 전 원상복구 완료) 4개 신규 도구의 생성→편집→자동저장 전체 사이클, 모드 전환 애니메이션, 히스토리 연동까지 스크린샷으로 확인함.

### 6. 로컬 전용 `/app-preview` 테스트 하네스 (레포에는 미포함)
- 사용자가 "로그인 없이 대시보드를 직접 눌러보고 싶다"고 요청 → `/api/generate`, `/api/history` 호출을 클라이언트에서 가로채 예시 데이터로 응답하는 `mockFetch.ts` + 실제 `AppWorkspace`를 그대로 재사용하는 `page.tsx`/`layout.tsx` 3개 파일을 작성.
- **중요**: 사용자가 "로컬에서만, 배포되는 곳(공유 브랜치/Vercel)에는 올리지 말라"고 명시적으로 선택함 → 이 3개 파일은 **repo에 커밋되어 있지 않음**. `SendUserFile`로 사용자에게 직접 전달했고, 로컬 작업 디렉터리에서도 삭제해서 `git status`가 깨끗한 상태.
- 사용자가 로컬(Windows, `C:\Users\angel\Desktop\aitool`)에서 이 파일들을 써보려고 시도하다가 **레포 자체를 아직 clone하지 못한 상태**(`package.json`이 없다는 에러)임을 확인 — 아래 "진행 중인 이슈" 참고.

### 7. 메인 랜딩페이지(`/`) 대대적 리뉴얼 (실서비스 코드베이스 직접 작업 — 이번 세션)
사용자가 "로컬 프리뷰 테스트 끝, 이제 프로덕션 코드베이스를 직접 작업"이라고 명시한 이후 진행:

- **모드별 시각 테마 신설**: `src/lib/landingTheme.ts` — 직장인(Navy/Cyan: sky→cyan 그라디언트) vs 학생(Indigo/Lavender: indigo→violet 그라디언트) 색상·문구 토큰을 한 곳에서 관리. `/app` 워크스페이스의 `src/lib/theme.ts`(CSS 변수 기반)와는 별도 — 랜딩페이지는 서버 컴포넌트가 대부분이라 Tailwind 리터럴 클래스 토큰 방식을 씀.
- **호버 확장 애니메이션 버그 수정**: 기존엔 인트로 기능 카드 4개 중 `detail` 필드가 있는 카드(직장인 모드 1개)만 호버 시 펼쳐졌음. 모든 인트로 하이라이트 카드(4개) + 모드별 도구 쇼케이스 카드(전체 10개)에 동일한 `grid-rows-[0fr]→[1fr]` 패턴을 일괄 적용해 전부 정상 동작하도록 수정.
- **신규 섹션 4개 추가**:
  - `ModeShowcase.tsx` — 직장인 vs 학생 모드 대형 비교 패널(모드별 테마 색상 + 차별화된 가치 제안 문구)
  - `PainPoints.tsx` — 직장인(보고서/회의록/주간보고 고충)·학생(강의복습/발표문/레포트 고충) 페인포인트 → 해결 화살표
  - `ToolShowcase.tsx` — `src/lib/tools.ts`의 실제 도구 10종(직장인 5 + 학생 5)을 모드 색상으로 쇼케이스, 카드마다 호버 시 보조 설명 노출 + 하단에 공통 AI 채팅 안내 배너
  - `CloudSyncDemo.tsx`(client) — 가짜 채팅 UI 위에 "대화 진행 중 → 저장 중... → 클라우드에 저장 완료" 상태를 Framer Motion으로 순환시켜 실시간 자동 저장을 시각적으로 시연
- **문구 전면 재작성**: 히어로, 인트로 하이라이트, "사용 방법" 3단계, FAQ 전체를 자연스러운 톤으로 다시 씀. 직장인 관련 카피는 깔끔한 비즈니스 톤, 학생 관련 카피는 친근한 동기부여 톤으로 구분.
- **오래된 카피/버그 정리(겸사겸사 발견)**:
  - FAQ "제가 입력한 내용이 밖으로 새어나가지 않나요?" 항목이 클라우드 동기화 이전의 "로컬 처리" 문구 그대로 남아있던 것을 발견해 수정(위 "앞으로 할 일" 5번 항목 완료 처리).
  - 푸터의 "Powered by Google Gemini" 문구가 "AI 모델명을 사용자에게 절대 노출하지 않는다"는 하드 제약(PROGRESS.md 섹션 5 참고)과 정면으로 어긋나는 것을 발견해 모델명 비노출 문구로 교체.
- **검증**: `npx tsc --noEmit` / `npm run lint` / `npm run build` 전부 통과(`/`는 여전히 정적 프리렌더링됨, prerender 에러 재발 없음). `npm run dev` + headless Chromium으로 전체 페이지 스크린샷, 직장인/학생 도구 카드 각각 호버 확장 동작, 클라우드 저장 상태 3단계 순환(대화 진행 중→저장 중...→저장 완료)을 실제로 캡처해서 확인함.
- **의도적으로 미루거나 그대로 둔 것**: 헤더의 "Support" 버튼은 이전 세션에서 이미 "UI만, 나중에 외부 링크 연결" 명시된 플레이스홀더라 그대로 둠. `/app` 워크스페이스 내부(로그인 후 화면)는 이번 작업 범위 밖 — 오직 `/`(마케팅 랜딩페이지)만 손댔음.

## 현재 git 상태 — 정상, 최신

- 마지막 커밋: `fc78e8a` "랜딩페이지 대대적 리뉴얼: 모드별 테마, 클라우드 저장 UX, 콘텐츠 확장"
- `claude/memory-sync-intent-ib4fj5` 브랜치, 원격에 푸시 완료. `git status` 깨끗함(uncommitted 없음).
- 이 브랜치는 `claude/memory-sync-verify-0bfkhh`(위 1~6번 작업 전부 포함)를 fast-forward로 흡수한 뒤 7번 작업을 이어서 커밋한 상태 — 두 브랜치 작업 내용이 전부 하나로 합쳐져 있음.
- ⚠️ 이 커밋은 아직 Vercel에 새로 배포된 게 확인되지 않음 — 다음 세션에서 이 브랜치 기준 Preview 배포 상태(`READY` 여부)부터 확인할 것.

## ⚠️ 진행 중인 이슈 — 사용자 로컬(Windows) 개발 환경 설정

사용자가 `C:\Users\angel\Desktop\aitool` 폴더에서 로컬로 `/app-preview` 테스트 하네스를 돌려보려고 시도 중인데, **아직 레포를 성공적으로 clone하지 못함**(`npm install`/`npm run dev` 둘 다 `package.json`을 못 찾는다는 에러). 다음 세션(또는 이 세션 계속)에서 가장 먼저 확인할 것:

1. 사용자가 `git --version`으로 Git이 설치되어 있는지 확인했는지.
2. `git clone -b claude/memory-sync-verify-0bfkhh https://github.com/angelsj913/Kx.git aitool2` 명령이 실제로 성공했는지(폴더가 새로 생기고 `Receiving objects...` 로그가 찍혔는지).
3. clone 성공 확인 후(`dir package.json`으로 확인) → `npm install` → `npx prisma generate` → 아래 3개 파일을 `src/app/app-preview/`에 추가 → `npm run dev` → `http://localhost:3000/app-preview` 순서로 안내 이어가기.
4. 이 3개 파일(레포에는 없음, 사용자에게 이미 전달했지만 세션이 끊기면 다시 전달해야 할 수 있음): `src/app/app-preview/page.tsx`, `layout.tsx`, `mockFetch.ts` — 내용은 커밋 `adff027`의 `src/app/app/page.tsx` + `src/lib/theme.ts` 등을 그대로 재사용하는 방식으로 작성됨(자세한 내용은 이 세션 대화 기록 참고, 필요하면 새로 작성 가능).

## 앞으로 할 일 (우선순위 순)

1. **[진행 중] 사용자 로컬 개발 환경 clone 완료 지원** — 위 이슈 참고.
2. **실제 크리덴셜 Vercel 등록 여부 확인** — `DATABASE_URL`(Neon), `AUTH_GOOGLE_ID`/`SECRET`(Google Cloud Console), `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`(Vercel Blob), `GEMINI_API_KEY`/`OPENROUTER_API_KEY`. Vercel MCP에는 환경변수 조회 툴이 없어서 코드로는 확인 불가 — 사용자가 Vercel 프로젝트 설정 화면에서 직접 확인해야 함.
3. **실제 로그인 플로우 검증** (크리덴셜 확인/등록 후) — 구글 로그인 → AI 생성(신규 구조화 도구 4종 포함) → 로그아웃 → 다른 기기에서 같은 계정 로그인 → 히스토리 이어보기 전체 시나리오.
4. **`prisma migrate` 실행 여부 확인** — 지금까지 `prisma generate`/`validate`만 했음. 실제 Neon DB에 스키마가 반영되어 있는지(`HistoryItem`, `ChatConversation` 등 신규 필드 포함) 확인 필요.
5. ~~FAQ 2번째 항목 카피 교체~~ — **완료** (섹션 7 참고, 클라우드 동기화에 맞는 문구로 교체함).
6. **이 브랜치(landing 리뉴얼 포함) Vercel 배포 확인** — 최신 커밋(`fc78e8a`)이 실제로 Preview에 `READY`로 올라갔는지, 스크린샷 없이 로컬 dev 서버로만 검증했으므로 배포 환경에서도 한 번 더 확인 권장.
7. **Electron 데스크톱 앱과 클라우드 연동** (범위 밖으로 계속 미뤄지고 있는 것):
   - Electron 앱은 설치본마다 자기만의 로컬 서버 → 배포된 Vercel API를 바라보도록 변경 필요.
   - Google OAuth가 Electron `BrowserWindow` 안에서 막힘(`disallowed_useragent`) → 시스템 브라우저로 열어 처리하는 방식 구현 필요.
8. **(선택) AiChat/Account/AudioInput 모드별 테마 적용 확대** — 이번 세션에서 의도적으로 범위 제외함. 사용자가 전체 통일감을 원하면 추가 작업 가능.
9. **(선택) 헤더 "Support" 버튼 실제 링크 연결** — 여전히 클릭해도 아무 동작 없는 UI 전용 플레이스홀더. 외부 지원 페이지 URL이 정해지면 연결.

## 환경변수 (전부 사용자가 직접 설정 — 이 세션엔 실제 키 없음)

| 변수 | 용도 |
|---|---|
| `AUTH_SECRET` | NextAuth 세션/쿠키 서명 |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | 구글 OAuth (Google Cloud Console에서 발급) |
| `DATABASE_URL` | Neon Postgres 연결 문자열 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 업로드 권한 |
| `GEMINI_API_KEY` | Gemini 모델 호출용 (서버 전용) |
| `OPENROUTER_API_KEY` | OpenRouter 무료 모델 폴백용 |

로컬에서 빌드/타입체크만 할 때는 아래처럼 placeholder 값으로 충분함(실제 DB/AI 호출은 안 되지만 `npm run build`/`tsc`는 통과):
```
DATABASE_URL="postgresql://x:x@localhost:5432/x" AUTH_SECRET="placeholder" AUTH_GOOGLE_ID="x" AUTH_GOOGLE_SECRET="x"
```

## 주요 파일 위치 요약

```
src/lib/tools.ts                도구 레지스트리 (신규 4종 포함 총 10개 도구)
src/lib/structured.ts           신규 구조화 도구 타입/파서
src/lib/theme.ts                모드별 테마 토큰 (CSS 변수)
src/lib/useAutosave.ts          디바운스 자동저장 훅
src/lib/appMode.ts              학생/직장인 모드 상태
src/lib/models.ts               AI 모델 자동 전환 순서 (사용자에게 비노출)
src/lib/ai.ts                   generateWithFallback / chatReplyWithFallback
src/lib/gemini.ts, openrouter.ts  프로바이더별 실제 호출 구현
src/lib/prisma.ts               Prisma 클라이언트 싱글턴 (Neon 어댑터)
src/lib/history.ts              히스토리 fetch 훅 (useHistory)
src/lib/personas.ts             채팅 페르소나 5종
src/auth.ts                     NextAuth 설정
src/proxy.ts                    /app 라우트 로그인 게이트
prisma/schema.prisma            DB 스키마
prisma.config.ts                Prisma CLI 설정
src/app/app/page.tsx            앱 메인 워크스페이스 (듀얼 모드 테마 + 전환 애니메이션)
src/components/structured/      신규 구조화 도구 4종 뷰 컴포넌트 + StructuredResultView 디스패처
src/components/Sidebar.tsx, ModeSwitch.tsx, Dashboard.tsx  듀얼 모드 테마 적용된 워크스페이스 크롬
src/components/AiChat.tsx       AI 채팅 (대화 목록/영속화, 테마 미적용)
src/components/Account.tsx      내 계정 화면
src/components/GeneratorView.tsx / HistoryView.tsx / FileResultPanel.tsx / ResultPanel.tsx  도구 생성/히스토리 UI
src/app/api/generate/route.ts               도구 생성 API (structured 분기 포함)
src/app/api/history/**                      히스토리 API (PATCH 자동저장 라우트 포함)
src/app/api/chat/conversations/**           채팅 대화 API
src/app/api/auth/[...nextauth]/route.ts     NextAuth 핸들러
src/components/landing/                     랜딩페이지 컴포넌트 (DownloadCta/HowItWorks/Faq)
src/app/login/page.tsx                      로그인 페이지 (구글 로그인 + 이메일 목업)
```

## 참고 — "이 Next.js는 학습 데이터와 다르다" (AGENTS.md 지침)

이 프로젝트는 Next.js 16.2.10 정식 버전이며, 학습 데이터의 관행과 실제로 다른 부분이 있으니 새 기능을 짤 때는 `node_modules/next/dist/docs/`의 관련 가이드를 먼저 확인할 것.

**이번 세션까지 확인된 함정들:**
- `middleware.ts`가 아니라 **`src/proxy.ts`** + `export const proxy = auth(...)`. Node.js 런타임 고정.
- Prisma 7: `generator client { provider = "prisma-client", output = "../src/generated/prisma" }` 필수. `datasource.url`을 스키마에 쓰면 P1012 에러 — `prisma.config.ts` + 런타임 어댑터(`PrismaNeon`)로 분리.
- **Vercel 배포 시 `postinstall: "prisma generate"`가 없으면 빌드가 무조건 실패함** — 로컬은 수동 실행으로 가려짐. (이번 세션에 발견/수정)
- `react-hooks` v7의 `set-state-in-effect` 규칙: `useEffect` 안에서 `useCallback` 함수(내부 setState)를 직접 호출하면 lint 에러 → 인라인 async IIFE로 우회(`src/lib/useAutosave.ts` 참고, 동일 패턴).
- `eslint-config-next` flat config 전환, `error.tsx`/`global-error.tsx`의 `unstable_retry` 콜백.
