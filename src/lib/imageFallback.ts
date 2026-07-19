/**
 * 이미지 생성 폴백 — Gemini(gemini-2.5-flash-image, 무료 하루 500회)가 쿼터 소진·오류로
 * 실패했을 때 대체 생성기. Pollinations.ai: 키 불필요·무료(Flux/SD 계열). 학생용 서비스라
 * 별도 결제·키 설정 없이 즉시 폴백되게 이 제공자를 기본값으로 택했다.
 *
 * 필요 시 키 기반 제공자(OpenAI gpt-image, Cloudflare Workers AI 등)를 여기 추가해
 * 우선순위 체인으로 확장할 수 있다.
 */

export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

const POLLINATIONS_ENDPOINT = "https://image.pollinations.ai/prompt";

/** 텍스트 프롬프트로 대체 이미지를 생성한다. 실패 시 throw. */
export async function fallbackGenerateImage(prompt: string): Promise<GeneratedImage> {
  const clean = prompt.trim().slice(0, 1500);
  if (!clean) throw new Error("이미지 설명이 비어 있습니다.");

  const seed = Math.floor(Math.random() * 1_000_000);
  const url =
    `${POLLINATIONS_ENDPOINT}/${encodeURIComponent(clean)}` +
    `?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;

  // 이미지 생성이 느릴 수 있어 넉넉한 타임아웃.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, {
      headers: { accept: "image/*" },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`대체 이미지 생성 실패 (${res.status})`);
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      throw new Error("대체 이미지 응답이 이미지가 아닙니다.");
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 256) {
      throw new Error("대체 이미지가 비어 있습니다.");
    }
    return { data: buf.toString("base64"), mimeType: contentType };
  } finally {
    clearTimeout(timer);
  }
}
