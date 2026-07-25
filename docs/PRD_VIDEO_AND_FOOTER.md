# PRD: 데모 영상 재생 보장 + 푸터 경계·로고 정리

> 상태: 초안 (승인 대기) · 작성일 2026-07-25
> 선행: `PRD_LANDING_SAFARI_FIX.md`(#47·#48), `PRD_LANDING_SCROLL_BUGS.md`(A·B·C 반영 완료)
> 보고: "수학 풀이 영상이 재생이 안돼" + 푸터 스크린샷(경계선·로고 고립)

---

## 1. Context

랜딩 데모 영상이 재생되지 않는다. 그리고 푸터에 위 섹션과의 경계선이 보이고, 로고 워터마크가
본문에서 한참 떨어져 혼자 떠 있다.

추가 요구(확인됨):
- **자동재생 연출은 유지**하되 **어떤 환경에서든 반드시 재생**되게 할 것
- **PPT 생성 영상은 빼고 수학 풀이 영상만** 남길 것
- 푸터 경계선은 **완전히 제거**, 로고는 **대표자 이름과 같은 줄 높이로** 올릴 것

---

## 2. 근본 원인

### A. 영상이 재생되지 않는다 【P0】

`ffprobe` 실측 (`public/videos/workspace-math-chat.webm`):

```
codec_name = vp9        ← 핵심
container  = WebM
1280x720, 24.0s, 997KB
```

**WebM/VP9는 Safari에서 신뢰할 수 없다.**
- iOS Safari: 17.4 이전 **WebM 미지원**, 이후에도 VP9 재생이 불안정
- macOS Safari: WebM 컨테이너 지원이 늦고 여전히 불완전
- Chrome/Firefox/Edge: 정상 → 그래서 데스크톱 크롬에서는 문제가 안 보였다

`WorkspaceIntro.tsx`에는 **`<source>`가 WebM 하나뿐**이라 Safari에서는 재생할 소스가 아예 없다.

여기에 내가 직전 개편에서 만든 **2차 결함**이 겹쳤다:
- `controls={reduced}` → 동작 줄이기가 꺼져 있으면 **컨트롤이 없다**
- 자동재생 실패를 `.catch(() => {})`로 **조용히 삼킨다**
- `preload="metadata"` 상태에서 즉시 `play()` → 데이터 부족으로 거부될 수 있다

즉 **재생이 실패해도 사용자가 손쓸 방법도, 실패 사실을 알 방법도 없었다.** 내 잘못이다.

### B. 푸터 경계선 【P1】

`src/components/landing/Footer.tsx:15`

```tsx
<footer className="border-t border-slate-200/60 dark:border-slate-800/60">
```

경계선의 유일한 원인이다. 푸터는 자체 배경이 없어 `.landing-shell` 표면이 그대로 비치므로,
이 `border-t`만 제거하면 색 불일치 없이 자연스럽게 이어진다.
(앞 섹션 `Pricing`은 이미 배경·테두리 없음 — 헤더 경계선 수정 때 정리됨)

### C. 로고가 혼자 아래에 뜬다 【P1】

`Footer.tsx:36-39` — 워터마크가 **고정 높이 밴드**에 들어 있다.

```tsx
<div className="... flex h-[clamp(8rem,18vw,14rem)] items-end justify-center overflow-hidden pb-2">
  <div className="relative h-[min(70%,12rem)] w-[min(92vw,36rem)] opacity-[0.07] ...">
```

밴드 높이가 128~224px인데 로고는 그 70%만 차지하고 `items-end`로 아래 정렬 → **위쪽 30%가 빈 공간**.
여기에 텍스트 행의 `py-10`(40px)이 더해져 큰 간격이 된다.

---

## 3. 수정 방안

### A-1. MP4(H.264) 소스 추가 — 뿌리 해결

`ffmpeg`로 기존 WebM에서 MP4를 생성해 `public/videos/`에 추가한다.

```
-c:v libx264 -profile:v main -pix_fmt yuv420p -crf 23 -movflags +faststart -an
```

- **H.264/MP4는 모든 브라우저·모든 iOS에서 재생**된다 — 이게 근본 해결
- `+faststart`: 메타데이터를 앞으로 옮겨 스트리밍 즉시 재생
- `yuv420p`: 최대 호환 픽셀 포맷
- `-an`: 원본에 오디오 스트림이 없고 무음 자동재생이므로 제거

마크업은 **MP4를 먼저** 둔다(브라우저는 첫 재생 가능 소스를 고른다):

```html
<source src="/videos/workspace-math-chat.mp4" type="video/mp4" />
<source src="/videos/workspace-math-chat.webm" type="video/webm" />
```

### A-2. "무조건 재생" 보강

- `preload="metadata"` → **`preload="auto"`** (재생 시점에 데이터 확보)
- `canplay` 이벤트에서 **재생 재시도**
- 자동재생이 정책상 막히거나 실패하면 **재생 버튼을 노출**(평소엔 숨김)
  → 자동재생 연출은 유지하면서, 실패 시 사용자가 직접 누를 수 있는 탈출구 확보
- `muted` + `playsInline` 유지(iOS 자동재생 필수 조건)
- 실패를 조용히 삼키지 않고 상태로 반영

### A-3. PPT 영상 제거 — 수학 영상만

- 탭 전환 UI 제거 → **영상 하나**를 크게. 브라우저 크롬 프레임은 유지
- `workspace.video2` i18n 키는 다른 사용처가 없으면 미사용으로 남음(삭제는 별도)
- **파일은 삭제하지 않고 남긴다**(`workspace-artifact.webm` + 포스터).
  페이지에서만 제거 — 되돌리기 쉽고 500KB라 부담이 없다.
  *완전 삭제를 원하시면 알려주세요.*

### B. 푸터 경계선

`Footer.tsx:15`의 `border-t …` **제거**. 다른 변경 불필요.

### C. 로고를 대표자 이름과 같은 줄로

- 고정 높이 밴드(`h-[clamp(8rem,18vw,14rem)]`, `items-end`, `overflow-hidden`) **통째로 제거**
- 텍스트 행 컨테이너에 `relative` 부여 후, 로고를 그 안에 **절대 배치·수직 중앙 정렬**
  → 로고 중심이 `대표 권승준` 줄과 같은 높이가 된다
- 텍스트(`nav`, `p`)에 `relative z-10`을 줘 로고 위로 올린다
- 행의 세로 여백을 약간 키워(`py-10` → `py-14`) 로고가 답답하지 않게
- 워터마크 느낌(투명도 0.07/0.09) 유지

> 참고: 푸터는 `.landing-shell > *:not(header)` 규칙으로 `z-index:1` 스택 컨텍스트를 만든다.
> 로고를 그 안에 두면 텍스트 뒤·배경 그라데이션 위에 정상 렌더된다.

---

## 4. 영향 파일

| 파일 | 변경 |
|---|---|
| `public/videos/workspace-math-chat.mp4` | **신규** — ffmpeg 트랜스코딩 산출물 |
| `src/components/landing/WorkspaceIntro.tsx` | MP4 소스 우선, 탭 제거(수학만), 자동재생 보강 + 실패 시 재생 버튼 |
| `src/components/landing/Footer.tsx` | `border-t` 제거, 워터마크를 텍스트 행에 절대 배치 |

---

## 5. 검증

**정적**
- [ ] `tsc --noEmit` · `eslint` clean · `next build` 성공
- [ ] `ffprobe`로 생성된 MP4가 **h264 / yuv420p / faststart** 인지 확인
- [ ] 빌드 HTML에 `<source type="video/mp4">`가 **WebM보다 먼저** 나오는지 확인

**실기기 (사용자)**
- [ ] **아이폰 Safari**에서 수학 영상이 실제로 재생되는지 ← 이번 수정의 핵심
- [ ] 데스크톱 크롬에서도 정상 재생되는지(회귀 없음)
- [ ] 동작 줄이기 ON 상태에서 컨트롤로 재생 가능한지
- [ ] 푸터 경계선이 사라지고, 로고가 대표자 이름과 같은 높이에 있는지

---

## 6. 리스크

| 리스크 | 완화 |
|---|---|
| MP4 추가로 저장소 용량 증가(약 0.5~1MB) | WebM은 남겨 두 소스 병행. 필요하면 WebM 삭제로 상쇄 가능 |
| 자동재생이 저사양·절전 모드에서 여전히 막힐 수 있음 | 실패 시 재생 버튼 노출로 **항상** 재생 경로 확보 |
| 로고 절대 배치가 좁은 화면에서 텍스트와 겹쳐 보임 | 투명도 0.07 유지 + 텍스트 `z-10`, 모바일 폭에서 로고 크기 축소 |

---

_승인되면 A(영상) → B·C(푸터) 순으로 구현하고 프리뷰 URL을 드립니다._
