import { getDownloadUrl } from "@vercel/blob";

/**
 * Private Blob URL이면 짧은 서명 URL을 만들고, 실패·레거시 public URL은 원본을 반환한다.
 */
export async function resolveInquiryFileUrl(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url) return null;
  try {
    return await getDownloadUrl(url);
  } catch {
    return url;
  }
}
