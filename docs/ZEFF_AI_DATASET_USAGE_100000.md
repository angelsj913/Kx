# ZEFF AI 10만개 데이터셋 사용 가이드

이 문서는 `10만개 확장 데이터셋`을 어떻게 쓰는지, 그리고 사용자가 말한 `자체 학습`을 현재 프로젝트와 환경에서 어떤 의미로 구현할 수 있는지 자세히 설명합니다.

## 먼저 중요한 점

현재 이 레포와 실행 환경에서는 `기초 모델 자체를 파인튜닝`하는 의미의 학습을 바로 실행할 수 없습니다.

이유는 아래와 같습니다.

- 현재 레포에는 학습 파이프라인이 없습니다.
- GPU 학습 환경이 연결되어 있지 않습니다.
- 현재 프로젝트에서 `Groq`는 학습 플랫폼이 아니라 추론 제공자로 다룹니다.
- 앱 구조도 `웹앱 + 셸 클라이언트 + RAG`에 더 맞춰져 있습니다.

그래서 여기서 말하는 `자체 학습`은 현실적으로 아래 3가지를 뜻합니다.

- `1. 자체 지식 반영`: RAG 문서로 반영
- `2. 자체 정책 정렬`: system prompt와 규칙 파일로 반영
- `3. 자체 평가/실험`: 10만개 채팅형 데이터셋으로 외부 실험 또는 평가

## 생성 파일

- 10만개 원본: `docs/datasets/zeff-ai-training-100000.jsonl`
- 10만개 채팅형: `docs/datasets/zeff-ai-training-100000.messages.jsonl`
- 확장 RAG 원문: `docs/datasets/zeff-ai-rag-source-extended.md`
- 시스템 프롬프트 초안: `docs/datasets/zeff-ai-system-prompt.txt`
- 생성 스크립트: `scripts/generate-zeff-dataset.mjs`

## 저장소 운영 원칙

- `10만개` 산출물 2개는 파일 크기가 커서 기본 Git 추적 대상에서는 제외하는 편이 안전합니다.
- 필요하면 로컬에서 `node scripts/generate-zeff-dataset.mjs`로 다시 생성해 학습용 또는 외부 실험용으로 따로 보관합니다.
- 레포에는 생성 스크립트, 가이드, RAG 원문, 시스템 프롬프트, 비교적 작은 샘플셋을 남기는 구성이 운영하기 쉽습니다.

## 10만개는 어떻게 만들어졌나

기본 1000개 사실셋 위에 질문 프레이밍을 100가지로 확장해 `1000 x 100 = 100000` 구조로 만들었습니다.

### 포함된 주제

- 제품 개요
- Windows 배포와 서명
- Android Play Store
- 기술 스택
- Prisma/Vercel 빌드
- landing scale
- AI 제공자 역할
- RAG 구조
- 정책/금지 규칙
- handoff 대화 결정사항

### 질문 확장 방식

같은 사실이라도 아래처럼 다른 문맥에서 묻게 합니다.

- 현재 기준
- 실무적으로
- 운영 관점
- 비용 관점
- 제품 문맥
- handoff 문서 기준
- Play Store 준비 기준
- 오해 방지 기준
- 관리자 운영 기준
- 다음 단계 포함

또 여기에 출력 기대를 섞었습니다.

- 한 줄 요약 포함
- 다음 단계 포함
- 주의사항 포함
- 초보자 기준
- 비용 절감 방향
- 운영자가 바로 판단 가능하게
- 잘못 이해하기 쉬운 부분 포함
- 짧고 정확하게
- 이미 정한 방향을 재논쟁하지 않기

즉, `같은 정책을 다양한 질문 표현에서도 지키게 만드는 데이터셋`입니다.

## 방법 1: 가장 추천하는 사용법

이 프로젝트에서 가장 먼저 해야 할 일은 `RAG로 자체 반영`입니다.

### 왜 이게 가장 현실적인가

- 최신 정보 수정이 쉽습니다.
- 잘못된 내용을 바꾸려면 문서만 고치면 됩니다.
- 배포/정책/가격/운영 상황처럼 자주 바뀌는 정보에 적합합니다.
- 지금 레포에 이미 구현된 흐름과 바로 연결됩니다.

### 실제 순서

1. 아래 명령 실행

```bash
node scripts/generate-zeff-dataset.mjs
```

2. `docs/datasets/zeff-ai-rag-source-extended.md` 업로드
3. 앱의 `지식 검색 (RAG)` 화면에서 `색인`
4. 운영 질문으로 테스트

예시 질문:

- `왜 지금은 Windows 인증서보다 Android Play Store를 우선해?`
- `Play 등록이 아직 안 끝났을 때 어떻게 설명해야 해?`
- `Groq를 학습 플랫폼처럼 말하면 왜 안 돼?`
- `Prisma에서 다시 쓰면 안 되는 플래그가 뭐야?`

### 관련 구현

- 업로드 저장: [route.ts](file:///workspace/src/app/api/library/route.ts#L151-L204)
- 색인: [route.ts](file:///workspace/src/app/api/rag/index/route.ts#L12-L64)
- 검색: [route.ts](file:///workspace/src/app/api/rag/search/route.ts#L23-L105)
- RAG 화면: [RagView.tsx](file:///workspace/src/components/RagView.tsx#L159-L205)

## 방법 2: system prompt로 자체 정책 정렬

기초 모델을 다시 학습시키지 못하더라도, 정책과 금지 규칙은 system prompt로 강하게 고정할 수 있습니다.

### 사용할 파일

- `docs/datasets/zeff-ai-system-prompt.txt`

### 무엇이 들어 있나

- 한국어 기본 응답
- 공식 도메인 고정
- 셸 앱 구조 설명
- 비용 민감도 우선
- SmartScreen 과장 금지
- Play 공개 전 과장 금지
- Prisma 제거 플래그 재제안 금지
- 확인되지 않은 내용 단정 금지

### 추천 사용법

- system prompt는 짧게 유지
- 긴 배경 지식은 RAG로 넘김

즉 아래처럼 역할 분리:

- `system prompt`: 행동 규칙
- `RAG`: 사실/배경/절차

## 방법 3: 10만개 채팅셋을 외부 실험용으로 쓰기

### 사용할 파일

- `docs/datasets/zeff-ai-training-100000.messages.jsonl`
- 이 파일은 대용량이므로 레포에 고정 보관하기보다 로컬 생성 후 별도 보관하는 편이 좋습니다.

### 추천 분할

- 학습: 80000
- 검증: 10000
- 테스트: 10000

### 왜 전체를 바로 쓰지 않나

- 성능 평가를 하려면 미사용 질문셋이 필요합니다.
- 정책 준수 여부를 검증하려면 테스트셋을 따로 보관해야 합니다.

### 무엇을 평가해야 하나

- 한국어 기본 응답 유지
- `https://zeffai.com` 기준 설명 유지
- 셸 앱 구조 유지
- 비용 우선 판단 유지
- SmartScreen 과장 금지
- Play 미출시 상태 과장 금지
- `db push --skip-generate` 재제안 금지

## 방법 4: 자체 학습처럼 보이게 만드는 실제 조합

현재 프로젝트에서 가장 현실적인 `자체 학습 느낌`은 아래 조합입니다.

### 조합

- `zeff-ai-rag-source-extended.md`
- `zeff-ai-system-prompt.txt`
- 필요 시 `zeff-ai-training-100000.messages.jsonl`

### 작동 방식

- RAG가 사실과 배경을 공급
- system prompt가 행동 규칙을 고정
- 채팅셋이 다양한 질문 표현에 대한 일관성 평가나 외부 실험에 사용

이렇게 하면 실제 파인튜닝 없이도 사용자는 `학습된 것처럼` 느끼는 응답 품질을 얻을 수 있습니다.

## 실제로 파인튜닝이 안 되는 이유를 더 분명히 설명하면

사용자가 말한 `자체 학습`을 문자 그대로 수행하려면 아래가 필요합니다.

- 학습 가능한 모델 선택
- 토크나이저/포맷 정의
- 학습 스크립트
- GPU 자원
- 체크포인트 저장소
- 배포된 추론 경로

현재 레포에는 이런 구성요소가 없습니다.

따라서 지금 바로 가능한 최선은:

- `10만개 데이터셋 준비`
- `RAG 반영`
- `system prompt 정렬`
- `외부 실험용 채팅 데이터 준비`

입니다.

## 유지보수 방법

새로운 대화나 정책이 추가되면 아래 순서가 좋습니다.

1. 먼저 `zeff-ai-rag-source-extended.md` 또는 사실 목록을 수정
2. `scripts/generate-zeff-dataset.mjs`를 업데이트
3. 다시 생성

```bash
node scripts/generate-zeff-dataset.mjs
```

4. RAG 재색인
5. 주요 운영 질문으로 회귀 테스트

## 가장 추천하는 실행 순서

1. `node scripts/generate-zeff-dataset.mjs`
2. `zeff-ai-rag-source-extended.md` 업로드
3. RAG 색인
4. `zeff-ai-system-prompt.txt`를 현재 응답 규칙에 반영
5. `zeff-ai-training-100000.messages.jsonl`은 로컬에서 생성한 뒤 외부 실험이나 평가셋으로 별도 보관

## 한 줄 결론

`10만개 확장`은 완료할 수 있고 실제 파일도 생성할 수 있지만, `자체 학습`은 현재 환경에서는 파인튜닝이 아니라 `RAG + system prompt + 대규모 채팅셋` 조합으로 구현하는 것이 가장 현실적입니다.
