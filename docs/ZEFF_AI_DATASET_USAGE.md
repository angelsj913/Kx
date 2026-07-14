# ZEFF AI 데이터셋 사용 가이드

이 문서는 `ZEFF AI` 운영 문맥용 데이터셋을 어디에 어떻게 쓰면 되는지 정리한 문서입니다.

## 생성 파일

- 원본 데이터셋: `docs/datasets/zeff-ai-training-1000.jsonl`
- 채팅 포맷 데이터셋: `docs/datasets/zeff-ai-training-1000.messages.jsonl`
- RAG 업로드용 원문: `docs/datasets/zeff-ai-rag-source.md`
- 생성 스크립트: `scripts/generate-zeff-dataset.mjs`

## 데이터 구분

- `zeff-ai-training-1000.jsonl`
  - 각 줄이 `{ id, language, category, tags, instruction, output }` 구조입니다.
  - 정책 문장, 제품 설명, 운영 원칙, 배포 지식 같은 내용을 학습 예시 형태로 담습니다.
- `zeff-ai-training-1000.messages.jsonl`
  - 각 줄이 `{ id, messages }` 구조입니다.
  - `system -> user -> assistant` 순서의 채팅 예시이므로 외부 학습 파이프라인에 넘기기 쉽습니다.
- `zeff-ai-rag-source.md`
  - 현재 레포의 RAG 기능에 바로 넣기 쉬운 문서형 지식 원문입니다.

## 다시 생성하는 방법

프로젝트 루트에서 아래 명령을 실행합니다.

```bash
node scripts/generate-zeff-dataset.mjs
```

실행이 끝나면 위 3개 파일이 다시 생성됩니다.

## 가장 바로 쓰는 방법: 현재 레포의 RAG에 넣기

이 방법이 가장 빠르고, 지금 구조와도 가장 잘 맞습니다.

### 1. RAG 원문 업로드

- 업로드할 파일: `docs/datasets/zeff-ai-rag-source.md`
- 현재 앱의 서재 업로드 기능으로 이 파일을 올립니다.
- 이 레포의 업로드 흐름은 문서를 `LibraryItem`으로 저장하고, 원문 텍스트는 `extractedText`로 다룹니다.

관련 코드:
- [route.ts](file:///workspace/src/app/api/library/route.ts)
- [schema.prisma](file:///workspace/prisma/schema.prisma#L148-L186)

### 2. 색인 실행

- 앱의 `지식 검색 (RAG)` 화면으로 이동합니다.
- 업로드한 문서에 대해 `색인` 버튼을 누릅니다.
- 이 단계에서 텍스트가 청킹되고 임베딩되어 `DocumentChunk`에 저장됩니다.

관련 코드:
- [RagView.tsx](file:///workspace/src/components/RagView.tsx#L159-L205)
- [route.ts](file:///workspace/src/app/api/rag/index/route.ts#L12-L64)
- [rag.ts](file:///workspace/src/lib/rag.ts#L12-L39)
- [embeddings.ts](file:///workspace/src/lib/embeddings.ts#L48-L73)

### 3. 질의

- 같은 화면에서 질문을 입력합니다.
- 예시:
  - `ZEFF AI에서 Android를 우선하는 이유가 뭐야?`
  - `Windows 서명 없이 SmartScreen 경고를 없앨 수 있어?`
  - `Prisma build에서 다시 쓰면 안 되는 플래그가 뭐야?`

검색 단계에서는 상위 관련 청크를 찾고, 그 조각만 AI 응답 컨텍스트로 사용합니다.

관련 코드:
- [route.ts](file:///workspace/src/app/api/rag/search/route.ts#L23-L105)

### 4. 이 방식이 좋은 이유

- 현재 레포에 이미 구현된 기능이라 추가 작업이 거의 없습니다.
- 잘못된 내용이 있으면 문서만 수정 후 재색인하면 됩니다.
- 비용이 낮고 운영이 단순합니다.
- `Groq 학습`처럼 별도 학습 인프라를 가정하지 않아도 됩니다.

## 학습 데이터셋처럼 쓰는 방법

이 프로젝트 안에서 바로 모델 재학습을 하지는 않더라도, 데이터셋을 아래처럼 사용할 수 있습니다.

### 1. 외부 학습용 시드 데이터

- 사용할 파일: `docs/datasets/zeff-ai-training-1000.messages.jsonl`
- 각 줄이 이미 `messages` 배열 형태라서 채팅형 학습 포맷으로 다루기 쉽습니다.
- 이 데이터는 특히 아래 목적에 적합합니다.
  - 한국어 답변 톤 고정
  - 비용 민감도 반영
  - 제품 설명 일관성 유지
  - 금지 문구 방지

예시 한 줄:

```json
{"id":"policy-no-smartscreen-claim-one-line","messages":[{"role":"system","content":"당신은 ZEFF AI 운영 문맥을 따르는 한국어 도우미입니다. 공식 도메인은 https://zeffai.com 이며, 비용 효율과 실무적 정확성을 우선합니다."},{"role":"user","content":"SmartScreen 관련 금지 문구 한 줄로 말해줘."},{"role":"assistant","content":"unsigned .exe가 SmartScreen 경고 없이 설치된다고 말하면 안 됩니다."}]}
```

### 2. 시스템 프롬프트 보강용

- 원본 JSONL에서 `category=policy`, `category=product`, `category=ai`만 추려서 시스템 규칙으로 압축할 수 있습니다.
- 추천 방식:
  - 시스템 프롬프트에는 `10~20줄` 수준의 핵심 규칙만 넣습니다.
  - 세부 배경 지식은 RAG 문서로 둡니다.

즉,

- 시스템 프롬프트: 짧은 운영 규칙
- RAG 문서: 긴 정책/배경/FAQ

이 조합이 가장 안정적입니다.

### 3. 평가셋으로 사용

- 전체 1000개를 전부 학습에 넣지 않고 일부는 평가용으로 남길 수 있습니다.
- 권장 예시:
  - 학습 800
  - 검증 100
  - 테스트 100

테스트 질문 예시:

- `Windows 인증서 비용을 어떻게 설명해야 해?`
- `Play Store 등록이 아직 안 끝났을 때 어떻게 말해야 해?`
- `ZEFF AI를 오프라인 앱처럼 소개해도 돼?`

이런 질문에 모델이 정해진 정책대로 답하는지 점검하면 됩니다.

## RAG와 학습 데이터의 역할 차이

둘은 비슷해 보여도 역할이 다릅니다.

### RAG가 잘하는 것

- 최신 정책을 문서만 바꿔서 반영
- 사실 기반 답변
- 긴 배경 정보와 상세 절차 검색
- 모델 교체와 무관한 지식 유지

### 학습 데이터가 잘하는 것

- 말투 통일
- 자주 틀리는 표현 교정
- 우선순위와 금지 규칙 내재화
- 제품 설명 방식 고정

### 추천 조합

- 현재 프로젝트에서는 `RAG + 짧은 시스템 프롬프트 + 필요 시 외부 학습용 데이터셋` 조합이 가장 현실적입니다.

## 현재 레포에서 바로 실험하는 구체적 순서

### A안: 코드 수정 없이 바로 사용

1. `node scripts/generate-zeff-dataset.mjs`
2. `docs/datasets/zeff-ai-rag-source.md` 업로드
3. RAG 화면에서 색인
4. 운영 질문으로 질의
5. 답변 품질 확인 후 문서 수정
6. 다시 색인

### B안: 운영 규칙 강화

1. `zeff-ai-training-1000.jsonl`에서 `policy`와 `product` 항목을 추출
2. 공통 규칙 10~20줄로 압축
3. 시스템 프롬프트에 반영
4. 긴 설명은 계속 `zeff-ai-rag-source.md`에 둠

### C안: 외부 학습 포맷으로 전달

1. `zeff-ai-training-1000.messages.jsonl` 사용
2. 학습 가능한 외부 플랫폼 포맷에 맞게 필요한 필드만 조정
3. 검증셋 100개는 따로 보관
4. 결과 모델이 아래 정책을 지키는지 평가
   - 한국어 기본 응답
   - https://zeffai.com 기준 설명
   - 저비용 우선
   - 셸 앱 구조 유지
   - SmartScreen 관련 과장 금지

## 데이터 유지보수 방법

### 새 정보가 생겼을 때

- 새 정책이나 결정사항을 바로 JSONL 1000개 전체에 손으로 넣기보다, 먼저 RAG 원문에 추가하는 편이 쉽습니다.
- 이후 필요하면 생성 스크립트의 사실 목록을 업데이트하고 다시 생성합니다.

### 어떤 내용을 우선 업데이트할지

- 제품 방향 변경
- 배포 링크 변경
- Play Store 공개 상태 변경
- Prisma/Next.js 빌드 규칙 변경
- AI 제공자 정책 변경

## 추천 운영 원칙

- 사실 정보는 `RAG 문서`
- 행동 규칙은 `system prompt`
- 말투/응답 습관은 `학습 데이터`

이렇게 역할을 분리하는 편이 유지보수와 품질 모두에서 유리합니다.
