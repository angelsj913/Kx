# PRD: 랜딩 스크롤 섹션 버그 수정 (빈 패널 · 진행 레일 · 가독성)

> 상태: 초안 (승인 대기) · 작성일 2026-07-25
> 선행: [`PRD_LANDING_SAFARI_FIX.md`](./PRD_LANDING_SAFARI_FIX.md) — CSP 장애·헤더 경계선은 해결 완료(#47, #48)
> 보고: 스크린샷 3장 (152043 / 152047 / 152059)

---

## 1. Context

헤더 경계선은 해결됐다("상단은 작업이 잘 되었는데"). 남은 신고는 세 가지다.

1. `PPT 원클릭 빌드` / `엑셀 정밀 스크립트 추출` / `보고, 듣고, 이해하는 강의 분석` 구간에서
   **우측 카드가 통째로 비어서** 나온다.
2. 좌측 진행 표시 **레일의 세로선**이 원을 관통하고 마지막 항목 아래로 길게 삐져나온다.
3. (조사 중 확인) 좌측 목록의 **비활성 항목이 거의 안 보일 만큼 흐리다.**

조사 결과 **빈 카드는 디자인 문제가 아니라 CSS 계산 버그**였다. 눈으로는 "디자인이 깨졌다"로 보이지만
원인은 한 줄짜리 산술 오류다. 이걸 먼저 고쳐야 목업 품질 논의가 의미를 갖는다.

> 중요한 정정: 빈 카드는 `FeatureShowcase`가 아니라 **`WorkLectureScroll`** 이다.
> `FeatureShowcase`의 목업 4종(`MockSummary`/`MockLecture`/`MockDocs`/`MockLibrary`)은
> 조사 결과 **정상적으로 실제 콘텐츠를 렌더**하고 있어 이번 범위에서 제외한다.

---

## 2. 근본 원인

### 버그 A — 우측 카드가 빈다 【P0 · 산술 오류】

`src/components/landing/WorkLectureScroll.tsx:248-252`

```jsx
<div className="overflow-hidden">
  <div className="flex will-change-transform"
       style={{ transform: `translateX(${trackX}%)`, width: `${SCENE_COUNT * 100}%` }}>
```

`src/lib/landingScroll.ts:112-115`

```ts
export function trackTranslatePercent(p: number, count: number): number {
  return -(p * (count - 1) * 100);      // 0 → −200%
}
```

**CSS에서 `translateX`의 백분율은 "요소 자신의 너비" 기준**이다. 이 트랙은 `width: 300%`이므로
`translateX(-200%)`는 컨테이너 기준 **−600%**, 즉 패널 6개만큼 왼쪽으로 밀린다.

- 장면당 올바른 이동량은 `100 / SCENE_COUNT` = **33.33%** 인데 100%씩 이동하고 있다.
- 결과: `p > 약 0.34` 부터 트랙 전체가 `overflow-hidden` 밖으로 나가 **빈 카드**가 된다.
  섹션이 `h-[420vh]`(`:205`)라 **스크롤 구간의 약 65%가 빈 화면**이다 — 신고 내용과 정확히 일치.
- 카드 높이가 유지되는 이유: `transform`은 레이아웃에 영향을 주지 않아 flex 행의 높이는 남는다.
- 하단 아이콘 3개만 보이는 이유: 그 줄(`:265`)은 클리핑 영역 **밖**이라 살아남는다.
  (참고로 이건 버튼이 아니라 현재 장면 표시기다 — `onClick` 없음)

`trackTranslatePercent`의 **호출부는 이 한 곳뿐**(`WorkLectureScroll.tsx:167`)이라 헬퍼를 고치면 끝난다.

### 버그 B — 진행 레일 세로선이 삐져나옴 【P1 · 레이아웃】

`src/components/landing/WhyZeff.tsx:275-281`

```jsx
<div className="grid items-stretch gap-8 lg:grid-cols-[240px_1fr]">
  <div className="relative hidden lg:block">
    <div className="absolute bottom-2 left-[1.125rem] top-2 w-px bg-slate-200 …" />
```

1. **`items-stretch`** 때문에 레일 칼럼이 *오른쪽 카드 높이*(`min-h-[18rem]` + 헤더)까지 늘어난다.
   선은 `top-2 bottom-2`로 그 늘어난 높이를 채우므로 **목록보다 100~140px 긴 꼬리**가 생긴다.
   같은 형태인 `WorkLectureScroll.tsx:207`은 `items-center`라 이 문제가 없다 — 차이가 이것뿐이다.
2. 파란 진행선(`:278-281`)에 형제 구현이 가진 `maxHeight: calc(100% - 2rem)` **클램프가 빠져** 있어
   100%에서 회색 트랙보다 더 내려간다.
3. 선이 `top-2`(0.5rem)에서 시작하는데 첫 원의 중심은 1.125rem이라, 선이 **첫 원 안에서부터** 그어진다.
   → "선이 원을 관통한다"는 인상의 실체.
4. `lineFill`(`:239`)이 컨테이너 높이의 %일 뿐 원 위치와 무관해, 파란 끝점이 **원 중간**에 자주 멈춘다.

### 버그 C — 비활성 항목이 너무 흐림 【P2 · 가독성】

`WorkLectureScroll.tsx:221` `opacity-40` + `:232` `text-slate-500` 이 **이중으로** 적용된다.
`slate-500`을 40% 불투명도로 깔면 실질 대비가 배경에 묻히는 수준이 된다.

---

## 3. 수정 방안

### A. 트랙 이동량 (한 줄)

`src/lib/landingScroll.ts` — 장면 폭 기준으로 정규화:

```ts
// translateX 백분율은 요소 자신의 너비(=count×100%) 기준이므로 장면당 100/count 만큼만 이동해야 한다.
return -(p * (count - 1) * (100 / count));
```

`p=1`일 때 `-66.67%` → 트랙 기준 `-200%`(컨테이너) = 마지막 장면. 정확히 일치한다.
호출부가 하나뿐이라 다른 영향은 없다.

### B. 진행 레일 — "단계 사이만 연결" (승인된 방향)

`WhyZeff.tsx`:
- 레일 칼럼에 **`self-start`** 부여(또는 그리드를 `items-start`로) → 칼럼이 목록 높이만큼만 차지 → 꼬리 제거
- 회색 선: `top-2 bottom-2` → **`top-[1.125rem] bottom-[1.125rem]`** (첫 원 중심 ~ 마지막 원 중심)
  → 선이 원 안에서 시작/끝나지 않고 **원과 원 사이에만** 그어진다
- 파란 선: 같은 시작점에서 `height: calc((100% - 2.25rem) * fill / 100)` 로 클램프
- `lineFill`을 **활성 인덱스에 스냅**(`activeIdx / (count-1) × 100`) + `transition-[height]`
  → 파란 끝점이 항상 원에 정확히 닿는다(현재의 "원 중간에서 멈춤" 제거)

### C. 비활성 항목 가독성

`WorkLectureScroll.tsx:221,232`:
- `opacity-40` → **`opacity-70`** (또는 제거)
- 비활성 제목 `text-slate-500` → **`text-slate-600 dark:text-slate-400`**
- 활성/비활성 대비는 **굵기·색**으로 주고 투명도에 의존하지 않는다

### D. 목업 품질 (승인된 방향 — "실제 산출물 재현")

A가 고쳐지면 `WorkLectureScroll`의 세 장면 목업이 비로소 보인다. 그 상태를 확인한 뒤,
`WhyZeff`에 이미 적용한 것과 같은 기준(실제 한국어 수치·파일명·표/슬라이드 형태)으로 부족한 장면만 보강한다.
**A 수정 후 실제 화면을 보고 판단**한다 — 지금은 안 보여서 품질 판단 자체가 불가능하다.

---

## 4. 영향 파일

| 파일 | 변경 |
|---|---|
| `src/lib/landingScroll.ts` | `trackTranslatePercent` 산술 수정 (버그 A) |
| `src/components/landing/WorkLectureScroll.tsx` | 비활성 항목 대비 개선 (버그 C), A 확인 후 목업 보강 |
| `src/components/landing/WhyZeff.tsx` | 레일 `self-start`, 선 범위·클램프·스냅 (버그 B) |

`FeatureShowcase.tsx`는 **건드리지 않는다**(정상 동작 확인됨).

---

## 5. 검증

**정적**
- [ ] `tsc --noEmit` · `eslint` clean · `next build` 성공
- [ ] `opacity:0` SSR 회귀 없음(0개 유지)

**계산 검증 (버그 A)**
- [ ] `trackTranslatePercent(0,3)=0`, `(0.5,3)≈-33.3`, `(1,3)≈-66.7` 단언
- [ ] 컨테이너 기준 환산: `-66.7% × 3 = -200%` = 마지막 장면 ✔

**실기기 (사용자)**
- [ ] 프리뷰에서 세 장면(`PPT`/`엑셀`/`강의`)이 스크롤 내내 **끊김 없이** 보이는지
- [ ] 레일 세로선 꼬리가 사라지고 파란 끝점이 원에 정확히 닿는지
- [ ] 비활성 항목이 읽히는지
- [ ] 아이폰 Safari + 동작 줄이기 ON 상태 동시 확인

---

## 6. 리스크

| 리스크 | 완화 |
|---|---|
| 트랙 수정으로 장면 전환 타이밍이 달라져 보일 수 있음 | 이동량만 정규화, `p` 계산·장면 인덱스 로직은 그대로 |
| 레일 `self-start`로 레일과 카드의 세로 정렬이 바뀜 | 시각 확인 후 필요하면 상단 패딩으로 미세 조정 |
| 목업 보강 범위가 커질 수 있음 | A 수정 후 **실제 화면을 보고** 부족한 것만 선별 |

---

_승인되면 A → B → C 순으로 구현하고, 프리뷰 URL을 드려 D(목업 보강) 여부를 함께 판단합니다._
