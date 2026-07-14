# ZEFF AI 1만개 데이터셋 사용 가이드

이 문서는 `ZEFF AI / Kx` handoff 문서, 이전 대화 의사결정, Play Store 등록 메모를 반영한 `1만개 확장 데이터셋`을 실제로 어떻게 써야 하는지 자세히 설명합니다.

## 생성 파일

- 기본 1000개 원본: `docs/datasets/zeff-ai-training-1000.jsonl`
- 기본 1000개 채팅형: `docs/datasets/zeff-ai-training-1000.messages.jsonl`
- 기본 RAG 원문: `docs/datasets/zeff-ai-rag-source.md`
- 확장 1만개 원본: `docs/datasets/zeff-ai-training-10000.jsonl`
- 확장 1만개 채팅형: `docs/datasets/zeff-ai-training-10000.messages.jsonl`
- 확장 RAG 원문: `docs/datasets/zeff-ai-rag-source-extended.md`
- 생성 스크립트: `scripts/generate-zeff-dataset.mjs`

## 1만개 데이터셋이 어떻게 만들어졌는가

확장판은 무작정 다른 사실을 1만개 만든 것이 아니라, 아래 구조로 확장했습니다.

### 1. 기본 사실 집합

기본 사실은 아래 주제를 포함합니다.

- 제품 개요
- 배포 구조
- Windows 서명과 신뢰
- Google Play 제출
- 기술 스택
- 빌드와 배포
- 홈페이지 스케일링
- AI 제공자와 역할
- RAG와 데이터 활용
- 응답 정책과 말투

### 2. handoff 반영

확장판에는 아래 내용이 추가 반영됩니다.

- Windows unsigned installer 운영 흐름
- Android Play Store 우선 결정
- `com.zeffai.app`
- `https://zeffai.com/login`
- `PLAY_STORE_URL` 미설정 상태
- `assetlinks.json` placeholder 상태
- `prisma db push --skip-generate` 금지
- 큰 화면 랜딩 스케일 분리 설정
- 비용 민감도 우선
- 이미 정한 방향은 재논쟁하지 않는 답변 정책

### 3. 질문 프레이밍 확장

같은 사실을 아래처럼 다른 문맥으로 묻게 만들어 10배 확장합니다.

- 현재 기준으로
- 실무적으로
- 운영 관점에서
- 비용 관점도 반영해서
- ZEFF AI 제품 문맥에서
- handoff 문서를 기준으로
- Play Store 준비 흐름까지 고려해서
- 오해하지 않게
- 다음 단계까지 포함해서

즉, `사실은 같지만 질문 표현이 달라졌을 때도 같은 정책으로 답하게` 만드는 목적입니다.

## 파일별 역할

### `zeff-ai-training-10000.jsonl`

각 줄이 아래 구조입니다.

```json
{
  "id": "policy-no-smartscreen-claim-explain-current",
  "language": "ko",
  "category": "policy",
  "tags": ["policy", "no-smartscreen-claim", "explain", "current"],
  "instruction": "현재 기준으로 SmartScreen 관련 금지 문구 설명해줘.",
  "output": "unsigned .exe가 SmartScreen 경고 없이 설치된다고 말하면 안 됩니다."
}
```

이 파일은 아래 용도에 좋습니다.

- 카테고리별 가공
- 평가셋 분리
- 정책/말투 규칙 추출
- 외부 파이프라인용 전처리 원본

### `zeff-ai-training-10000.messages.jsonl`

각 줄이 아래 구조입니다.

```json
{
  "id": "policy-no-smartscreen-claim-explain-current",
  "messages": [
    {
      "role": "system",
      "content": "당신은 ZEFF AI 운영 문맥을 따르는 한국어 도우미입니다..."
    },
    {
      "role": "user",
      "content": "현재 기준으로 SmartScreen 관련 금지 문구 설명해줘."
    },
    {
      "role": "assistant",
      "content": "unsigned .exe가 SmartScreen 경고 없이 설치된다고 말하면 안 됩니다."
    }
  ]
}
```

이 파일은 아래 용도에 좋습니다.

- 채팅형 예시 데이터
- 외부 학습 포맷 전달
- 내부 평가 자동화
- 프롬프트 성능 비교

### `zeff-ai-rag-source-extended.md`

이 파일은 가장 실전적인 용도입니다.

- handoff 요약
- 이전 대화 의사결정
- Play Store 제출 메모
- 정책/금지 규칙
- 기술/배포 설명

이 문서를 그대로 업로드해 현재 레포의 RAG 기능에 넣을 수 있습니다.

## 가장 추천하는 사용 방식

현재 프로젝트에서는 `RAG + 짧은 system prompt + 필요 시 채팅형 데이터셋` 조합이 가장 좋습니다.

### 이유

- 정책/배경/절차는 자주 바뀝니다.
- 문서 기반으로 두면 수정이 쉽습니다.
- 말투와 우선순위는 짧은 규칙으로 고정하는 편이 안정적입니다.
- 1만개 채팅셋은 시스템 규칙을 강화하거나 외부 실험용으로 쓰는 편이 낫습니다.

## 방법 1: 현재 레포에서 바로 쓰기

이 방법이 가장 빠르고 안전합니다.

### 단계 1. 생성

```bash
node scripts/generate-zeff-dataset.mjs
```

### 자동화 스크립트로 바로 반영

로그인 UI를 거치지 않고 서버 측에서 바로 `LibraryItem` 생성과 `DocumentChunk` 색인까지 끝내려면 아래 스크립트를 사용할 수 있습니다.

```bash
npm run rag:index:zeff -- --user-email you@example.com
```

공유 워크스페이스에 넣고 싶다면:

```bash
npm run rag:index:zeff -- --user-email you@example.com --workspace-id YOUR_WORKSPACE_ID
```

이 스크립트는 기본적으로 `docs/datasets/zeff-ai-rag-source-extended.md`를 읽어 같은 제목의 서재 항목을 만들거나 갱신하고, 기존 청크를 지운 뒤 다시 색인합니다.
실행 전에는 최소한 `DATABASE_URL`이 설정되어 있어야 하며, 의존성이 설치된 환경이어야 합니다.

### 단계 2. 업로드할 파일 선택

권장 파일:

- `docs/datasets/zeff-ai-rag-source-extended.md`

이유:

- handoff와 대화 의사결정이 같이 들어 있음
- 지금 사용자 선호와 운영 정책을 문서로 바로 검색 가능

### 단계 3. 앱 서재에 업로드

- 앱의 라이브러리 또는 서재 업로드 기능으로 markdown 파일을 올립니다.
- 업로드 후 문서는 `LibraryItem`으로 저장되고, 텍스트는 `extractedText` 중심으로 다뤄집니다.

관련 코드:

- [route.ts](file:///workspace/src/app/api/library/route.ts#L151-L204)
- [schema.prisma](file:///workspace/prisma/schema.prisma#L148-L186)

### 단계 4. 색인

- `지식 검색 (RAG)` 화면으로 이동합니다.
- 업로드한 문서 옆의 `색인` 버튼을 눌러 인덱싱합니다.
- 이 단계에서 텍스트가 청킹되고 임베딩되어 `DocumentChunk`에 들어갑니다.

관련 코드:

- [RagView.tsx](file:///workspace/src/components/RagView.tsx#L159-L205)
- [route.ts](file:///workspace/src/app/api/rag/index/route.ts#L12-L64)
- [rag.ts](file:///workspace/src/lib/rag.ts#L12-L71)
- [embeddings.ts](file:///workspace/src/lib/embeddings.ts#L48-L73)

### 단계 5. 질문

예시 질문:

- `왜 지금은 Windows 인증서보다 Android Play Store를 우선해?`
- `Play Console 등록 전에 먼저 해야 할 게 뭐야?`
- `Prisma build에서 다시 넣으면 안 되는 플래그가 뭐야?`
- `ZEFF AI를 오프라인 앱처럼 소개하면 왜 안 돼?`
- `Play URL이 비어 있다는 건 현재 무슨 상태야?`

### 단계 6. 문서 수정 후 재색인

새로운 의사결정이 생기면:

1. `zeff-ai-rag-source-extended.md`를 수정
2. 다시 업로드 또는 갱신
3. 재색인
4. 다시 질의

이 방식은 학습을 다시 돌리지 않아도 최신 정책이 반영됩니다.

## 방법 2: system prompt 강화용으로 쓰기

1만개 전체를 system prompt에 넣으면 안 됩니다.

### 추천 방식

1. `zeff-ai-training-10000.jsonl`에서 아래 카테고리만 추립니다.
   - `policy`
   - `product`
   - `ai`
   - `playstore`
2. 공통으로 반복되는 규칙만 추립니다.
3. 10~20줄 정도의 짧은 운영 규칙으로 압축합니다.

### system prompt에 넣기 좋은 핵심 예시

- 기본 응답 언어는 한국어
- 공식 도메인은 https://zeffai.com
- 데스크톱과 모바일은 셸 앱
- 비용 민감도를 우선
- Windows 서명 없이 SmartScreen 경고 제거 가능하다고 말하지 않음
- Prisma 7.8에서 `db push --skip-generate`를 다시 제안하지 않음
- Play 등록 전에는 공개 완료처럼 말하지 않음

### 왜 이렇게 해야 하는가

- system prompt는 짧고 강하게 유지할수록 안정적입니다.
- 긴 배경지식은 RAG가 더 잘 처리합니다.

## 방법 3: 외부 채팅형 데이터셋으로 전달

이 프로젝트 안에서 직접 학습 파이프라인을 돌리는 건 아니더라도, 외부에서 실험하려면 `messages jsonl`이 가장 쓰기 쉽습니다.

### 권장 절차

1. `zeff-ai-training-10000.messages.jsonl` 사용
2. 전체를 바로 넣지 말고 분리
3. 추천 분할:
   - 학습: 8000
   - 검증: 1000
   - 테스트: 1000
4. 테스트셋은 따로 보관

### 테스트에서 확인할 항목

- 한국어 기본 응답 유지
- 비용 우선 판단 유지
- 셸 앱 구조 설명 유지
- Windows SmartScreen 관련 과장 금지
- Play 등록 상태를 과장하지 않음
- Groq를 학습 플랫폼처럼 설명하지 않음

## 방법 4: 평가 데이터셋으로 쓰기

1만개 전체를 학습용으로만 쓰지 말고, 일부는 평가 전용으로 쓰는 것이 좋습니다.

### 왜 필요한가

모델이 아래를 잘 지키는지 확인해야 하기 때문입니다.

- 제품 설명 일관성
- 정책 금지 문구 준수
- 최신 결정사항 반영
- Play 등록 상태 정확성
- 빌드 규칙 정확성

### 추천 평가 질문 그룹

- 제품 소개
- 배포 구조
- Windows 서명
- Android Play 등록
- Prisma/Vercel 빌드
- RAG 사용법
- 답변 정책/말투

## 지금 이 레포에서 가장 현실적인 조합

### 권장 조합

- `zeff-ai-rag-source-extended.md`: 사실/절차/배경
- 짧은 시스템 규칙: 정책 고정
- `zeff-ai-training-10000.messages.jsonl`: 외부 실험 또는 평가

### 이유

- RAG는 최신 정보 수정이 쉽습니다.
- system prompt는 정책 고정에 좋습니다.
- 대규모 채팅셋은 말투와 질의 변형 대응에 좋습니다.

## 새 정보가 생기면 어떻게 업데이트할까

### 1. 먼저 RAG 문서 수정

아래 변경은 먼저 문서에 반영하는 것이 좋습니다.

- Play Store 공개 완료
- 실제 스토어 링크 추가
- assetlinks 실제 지문 반영
- Vercel 빌드 규칙 변경
- 새 배포 경로 추가
- UI 배율 정책 변경

### 2. 그다음 생성 스크립트 수정

지속적으로 반복될 규칙이라면 `scripts/generate-zeff-dataset.mjs`의 사실 목록을 수정합니다.

### 3. 다시 생성

```bash
node scripts/generate-zeff-dataset.mjs
```

### 4. 재업로드 또는 재평가

- RAG에 다시 업로드하고 재색인
- 또는 평가셋을 다시 돌려 응답 일관성 확인

## 중요한 주의점

- 이 1만개는 현재 문맥을 잘 반영하도록 만든 `정책/설명 데이터셋`입니다.
- 실제 최신 사실은 시간이 지나면 바뀔 수 있습니다.
- 그래서 `고정 규칙`은 데이터셋에, `변하는 사실`은 RAG 문서에 두는 것이 중요합니다.
- `Groq 학습`이라고 표현하더라도, 현재 프로젝트 기준에서 가장 현실적인 사용법은 여전히 `RAG + 규칙 정렬`입니다.

## 짧은 추천 결론

가장 먼저 할 일은 아래 순서입니다.

1. `node scripts/generate-zeff-dataset.mjs`
2. `docs/datasets/zeff-ai-rag-source-extended.md` 업로드
3. RAG 색인
4. 운영 질문으로 검증
5. 필요하면 `policy` 카테고리만 뽑아 system prompt 압축
6. 외부 실험이 필요하면 `zeff-ai-training-10000.messages.jsonl`을 분할해서 사용
