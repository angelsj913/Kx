# RAG 재인덱싱 가이드

임베딩 provider가 변경되거나 `MIN_RETRIEVAL_SCORE`를 조정한 뒤에는 기존 `DocumentChunk`와 새 쿼리 벡터가 다른 공간에 있을 수 있습니다.

## 언제 재인덱싱하나

- `GEMINI_API_KEY`를 처음 설정하거나 embedding 모델이 바뀐 경우
- 로컬 fallback 임베딩으로 색인된 청크가 많은 프로덕션 환경
- RAG 적중률이 eval 골든셋에서 급격히 떨어진 경우

## 절차

1. **서재 항목 재인덱스** — 각 `LibraryItem`에 대해 `POST /api/rag/index` (본문 OCR/추출 후 `indexLibraryItem`)
2. **ZEFF 데이터셋** — `npm run rag:index:zeff` 또는 Admin RAG route
3. **검증** — `npm run eval:ai`의 `rag-hybrid-*` 케이스 통과 확인

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `MIN_RETRIEVAL_SCORE` | `0.15` | 미달 시 "근거 부족" 거절 |
| `GEMINI_API_KEY` | — | 프로덕션 임베딩 우선 |

## pgvector (Phase 9, 조건부)

청크 수 > 5000 또는 p95 지연 > 2s 측정 후 Neon pgvector 도입을 검토합니다. 현재는 Float[] + in-memory cosine 설계입니다.
