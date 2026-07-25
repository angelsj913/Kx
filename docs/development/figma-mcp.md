# Figma-Context-MCP (개발자용 design-to-code)

[Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP) (`figma-developer-mcp`)는 **Cursor 등 코딩 에이전트**가 Figma URL을 받아 레이아웃·토큰 메타를 간소화해 코드 구현에 쓰게 해주는 **stdio MCP 서버**입니다. **End-user 제품 기능이 아닙니다.**

## 5분 설정

1. [Figma Personal Access Token](https://www.figma.com/developers/api#access-tokens) 발급
2. 로컬/Cursor 환경에 `FIGMA_API_KEY` 설정 (repo에 커밋 금지)
3. Cursor MCP: `.cursor/mcp.json` 참고 (또는 Cursor Settings → MCP)
4. Figma 파일: **ZEFF AI - Homepage** — file key `GZF6qScpSoDxXEPzpGlC9E`

## ZEFF Figma 파일

- URL: `https://www.figma.com/design/GZF6qScpSoDxXEPzpGlC9E`
- 홈페이지 섹션 구현 시: Figma에서 프레임 URL 복사 → Cursor에 "이 디자인 implement" + URL

## figma-sync-notify와의 차이

| | figma-sync-notify (GitHub Actions) | Figma-Context-MCP |
|--|-----------------------------------|-------------------|
| 목적 | main push → Figma에 "바뀜" 댓글 | Figma → **정확한 코드** |
| 사용자 | 디자이너 | **개발자 (Cursor)** |
| 시점 | CI | 로컬 agent |

## 검증 시나리오

1. Figma URL 붙여넣기
2. landing 컴ponent 1개 implement
3. pixel/regression checklist (spacing, typography, colors)

## 트러블�hooting

- `401`: `FIGMA_API_KEY` 확인
- node-id: URL의 `node-id=1-2` → MCP에 `1:2` 형식
