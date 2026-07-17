/**
 * GPAI — 3D 수학 전용 도구 연동.
 *
 * 아직 실제 API 스펙(엔드포인트·인증 헤더·요청/응답 형식)을 확인하지 못한 상태라 실제
 * 호출부는 비워뒀다. 공개 문서(api-local.gpai.app 등)가 봇 차단(403)으로 막혀 있어
 * 이 세션에선 스펙을 확인할 방법이 없었다 — 키를 발급받을 때 문서/예시 요청(curl 등)도
 * 같이 확보해서 아래 callGpai 본문만 채우면 된다.
 *
 * 확인해야 할 것:
 * 1) 엔드포인트 URL (전체 경로)
 * 2) 인증 방식 — Authorization: Bearer, 커스텀 헤더, 쿼리 파라미터 중 무엇인지
 * 3) 요청 바디 형식 — 문제 텍스트/이미지를 어떤 필드로 보내는지, 3D 시각화 요청 방법
 * 4) 응답 형식 — 텍스트 풀이인지, 3D 씬 데이터(좌표·메시)인지, 이미지/embed URL인지
 *    → 이에 따라 결과를 어떻게 렌더링할지(새 구조화 도구 kind, 뷰 컴포넌트)가 갈린다.
 */

export class GpaiMissingKeyError extends Error {}
export class GpaiNotConfiguredError extends Error {}

export function hasGpaiKey(): boolean {
  return !!process.env.GPAI_API_KEY?.trim();
}

function requireGpaiKey(apiKey?: string): string {
  const key = apiKey || process.env.GPAI_API_KEY?.trim();
  if (!key) {
    throw new GpaiMissingKeyError(
      "GPAI API 키가 없습니다. GPAI_API_KEY 환경변수를 설정하세요.",
    );
  }
  return key;
}

export interface GpaiSolveInput {
  text?: string;
  /** 문제 사진 등 첨부 (base64) */
  images?: { data: string; mimeType: string }[];
  apiKey?: string;
}

export interface GpaiSolveResult {
  text: string;
  // TODO: 실제 응답 형식 확인 후 3D 데이터 필드 추가 (예: scene, meshes, embedUrl 등)
}

/**
 * TODO: 실제 GPAI REST API 호출로 교체.
 * 지금은 키/입력 유효성만 확인하고, 실제 fetch 직전에 명시적으로 에러를 던진다 —
 * 조용히 가짜 응답을 돌려주면 "됐다"고 착각하기 쉬우므로 일부러 실패하게 둔다.
 */
export async function callGpai(input: GpaiSolveInput): Promise<GpaiSolveResult> {
  requireGpaiKey(input.apiKey);
  throw new GpaiNotConfiguredError(
    "GPAI API 연동이 아직 구현되지 않았습니다 — 엔드포인트/요청 형식을 확인한 뒤 " +
      "src/lib/gpai.ts의 callGpai()를 채워주세요.",
  );
}
