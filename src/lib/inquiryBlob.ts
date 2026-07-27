import { toClientFileUrl } from "@/lib/blobAccess";

/**
 * 문의 첨부 URL → 인증 프록시(`/api/files`).
 * 관리자·본인 모두 세션 쿠키로 접근한다.
 */
export async function resolveInquiryFileUrl(
  url: string | null | undefined,
): Promise<string | null> {
  return toClientFileUrl(url);
}
