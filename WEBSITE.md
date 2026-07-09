# AI 툴킷 — 웹사이트(홈페이지) 관련 정리

> 이 문서는 `/` 경로(마케팅 홈페이지 = 다운로드 랜딩 페이지)에 대한 내용만 정리한 것. 앱 내부(`/app`, 로그인/DB/AI 채팅 등)에 대한 전체 진행 상황은 `PROGRESS.md` 참고.

## 구조 개요

홈페이지(`/`)와 실제 앱(`/app`)은 완전히 분리되어 있음.

- `/` — 로그인 불필요, 다운로드 유도용 정적 랜딩 페이지. 컴포넌트: `src/app/page.tsx`.
- `/app` — 실제 AI 도구가 있는 화면. 로그인 필요(구글 계정), `src/proxy.ts`가 게이트.

## 홈페이지 섹션 구성 (`src/app/page.tsx`)

1. **헤더**: 로고 "AI 툴킷" + "모든 버전 보기" 링크(GitHub Releases로 이동).
2. **히어로**: 제목 "필요한 AI 도구, 한 곳에 모았습니다" + 소개 문구 + 다운로드 버튼(`DownloadCta`) + "무료 · Windows 10/11(64-bit) 및 macOS 지원" 안내.
3. **기능 그리드** (4개 카드, `FEATURES` 배열):
   - 직장인 모드 — 문서·PPT·엑셀
   - 학생 모드 — 강의 요약·음성 정리·발표문
   - 로컬 히스토리 보관함
   - 안전한 데스크톱 실행
4. **사용 방법** (`HowItWorks` 컴포넌트) — 3단계: 다운로드/설치 → 기능 선택 → 결과 확인/저장.
5. **FAQ** (`Faq` 컴포넌트) — `<details>`/`<summary>` 아코디언, 5개 질문.
6. **푸터**: "Powered by Google Gemini · AI 툴킷 데스크톱 애플리케이션"

## 다운로드 버튼 동작 (`src/components/landing/DownloadCta.tsx`)

- "Windows 다운로드" / "Mac 다운로드" 두 버튼 → 클릭 시 OS별 안내 모달(다이얼로그) 오픈.
- 모달 안에 실제 다운로드 링크(`<a href=...>`) + 안내 문구 + 취소 버튼.
- `Esc` 키로 모달 닫기 지원.
- 다운로드 URL은 `src/lib/constants.ts`에서 관리:
  ```ts
  REPO = "https://github.com/angelsj913/Kx"
  WINDOWS_DOWNLOAD_URL = `${REPO}/releases/latest/download/AI-Toolkit-Windows-Installer.exe`
  MAC_DOWNLOAD_URL     = `${REPO}/releases/latest/download/AI-Toolkit-Mac-Installer.dmg`
  ALL_RELEASES_URL     = `${REPO}/releases`
  ```
  → **GitHub Release에 정확히 이 파일명(`AI-Toolkit-Windows-Installer.exe`, `AI-Toolkit-Mac-Installer.dmg`)으로 자산을 올려야 링크가 동작함.** Electron 빌드 산출물 이름이 이것과 일치하는지 릴리스 시 확인 필요.

## ⚠️ 지금 바로잡아야 할 내용 불일치 (홈페이지 카피 vs 실제 앱 동작)

가장 최근 세션에서 앱 내부에 **구글 로그인 필수화 + 클라우드 동기화**를 도입했는데, 홈페이지 카피는 아직 "회원가입 없이 바로 사용" 시절 문구 그대로 남아 있음. 다음 문구들이 실제 동작과 어긋남:

- `src/components/landing/HowItWorks.tsx` 1단계 설명:
  > "회원가입 기능은 추후 제공될 예정이며, 지금은 설치 후 바로 사용할 수 있습니다."
  → 실제로는 설치 후 **구글 로그인**을 해야 AI 기능을 쓸 수 있음(`/app`이 로그인 게이트됨).
- `src/components/landing/Faq.tsx` "회원가입을 해야 하나요?" 항목:
  > "지금은 회원가입 없이 사용할 수 있으며, 회원가입 기능은 나중에 추가될 예정입니다."
  → 실제로는 이제 회원가입(구글 로그인)이 필요함. FAQ 답변을 "네, 구글 계정으로 간단히 로그인하면 바로 사용할 수 있고, 로그인하면 다른 기기에서도 같은 계정으로 이어서 사용할 수 있습니다" 류로 교체해야 함.
- 홈페이지 기능 그리드의 "로컬 히스토리 보관함" 카드 설명도 이제 부정확함:
  > "생성한 모든 결과가 앱에 자동 저장되어..." — "로컬"이라는 표현이 이제 맞지 않음(로컬이 아니라 계정에 연결된 **클라우드**에 저장되고, 다른 기기에서도 불러옴). 카드 제목/설명을 "클라우드 히스토리"류로 갱신 권장.
- "안전한 데스크톱 실행" 카드도 "입력한 내용은 프로그램 안에서 처리되며 동의 없이 외부로 보내지 않습니다"라고 되어 있는데, 이제 AI 호출과 히스토리 저장이 서버(클라우드 DB/Blob)를 거치므로 문구 재검토 필요.

**다음 작업 시 해야 할 일**: 위 문구들을 로그인 기반 흐름에 맞게 수정하고, 필요하면 "구글 로그인으로 시작하기" 같은 문구를나 흐름을 홈페이지 사용 방법 섹션에 추가.

## 관련 파일 목록

```
src/app/page.tsx                      홈페이지 메인 (히어로 + 기능 그리드 + 푸터)
src/components/landing/DownloadCta.tsx   다운로드 버튼 + OS 선택 모달
src/components/landing/HowItWorks.tsx    "사용 방법" 3단계 섹션 — 문구 갱신 필요
src/components/landing/Faq.tsx           FAQ 아코디언 — 문구 갱신 필요
src/lib/constants.ts                     다운로드 링크/저장소 URL 상수
```

## 그 외 참고

- 홈페이지 자체는 이번 세션에서 로직 변경 없음 — 위 "내용 불일치" 항목만 다음 작업 대상.
- 배포: Vercel(`kx-chi.vercel.app`)에 `/`가 정적으로 서빙됨(`src/app/page.tsx`에 별도 `dynamic` 설정 없음 — 서버 컴포넌트 그대로 정적 렌더링 가능).
- 앱 내부 진행 상황(로그인/DB/AI 채팅 등)은 `PROGRESS.md`에 있음. 이 문서와 함께 다음 세션에서 이어서 참고할 것.
