/** Blob URL 첨부를 재생성·편집 시 base64 inline으로 다시 로드 */

export interface StoredAttachment {
  url: string;
  filename: string;
  mimeType: string;
}

export async function loadInlineFromStored(
  attachments: StoredAttachment[] | null | undefined,
): Promise<{ data: string; mimeType: string }[]> {
  if (!attachments?.length) return [];

  const results = await Promise.all(
    attachments.map(async (att) => {
      const res = await fetch(att.url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`첨부 파일을 불러오지 못했습니다: ${att.filename}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return { data: buf.toString("base64"), mimeType: att.mimeType || "application/octet-stream" };
    }),
  );
  return results;
}

export function parseStoredAttachments(raw: unknown): StoredAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is StoredAttachment =>
      !!a &&
      typeof a === "object" &&
      typeof (a as StoredAttachment).url === "string" &&
      typeof (a as StoredAttachment).filename === "string",
  );
}
