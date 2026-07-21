/**
 * Gemini 이미지 생성 실패 시 키 없는 폴백(Pollinations).
 * 학생용 서비스라 별도 결제 키 없이 즉시 대체 가능하도록 선택.
 */
export async function generateImageFallback(prompt: string): Promise<{
  data: string;
  mimeType: string;
  provider: string;
}> {
  const cleaned = prompt.trim().slice(0, 800);
  if (!cleaned) throw new Error("이미지 설명이 비어 있습니다.");

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleaned)}?width=1024&height=1024&nologo=true`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new Error(`이미지 폴백 생성 실패 (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 100) {
    throw new Error("이미지 폴백이 빈 결과를 반환했습니다.");
  }
  const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  return {
    data: buf.toString("base64"),
    mimeType: mimeType.startsWith("image/") ? mimeType : "image/jpeg",
    provider: "pollinations",
  };
}
