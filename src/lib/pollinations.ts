/**
 * Pollinations.ai — API 키 없이 동작하는 무료 이미지 생성.
 * https://image.pollinations.ai/prompt/{prompt}
 */
import { SafetyRefusalError } from "./gemini";

export interface PollinationsImage {
  data: string; // base64
  mimeType: string;
  model: string;
}

const DEFAULT_MODEL = "flux";

function safetyBlocked(message: string): boolean {
  return /(?:safety|nsfw|blocked|prohibited|content.?policy)/i.test(message);
}

/** 텍스트 프롬프트로 무료 이미지를 생성한다. */
export async function pollinationsGenerateImage(input: {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
}): Promise<PollinationsImage> {
  const model = input.model || process.env.POLLINATIONS_IMAGE_MODEL || DEFAULT_MODEL;
  const width = input.width ?? 1024;
  const height = input.height ?? 1024;
  const prompt = input.prompt.trim().slice(0, 800);
  if (!prompt) throw new Error("이미지 설명이 비어 있습니다.");

  const url = new URL(
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`,
  );
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("nologo", "true");
  url.searchParams.set("model", model);
  url.searchParams.set("enhance", "true");
  // 캐시 회피 — 동일 프롬프트 재시도 시 새 결과
  url.searchParams.set("seed", String(Date.now() % 1_000_000_000));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const detail = `Pollinations 이미지 생성 오류 (${res.status})`;
    if (safetyBlocked(detail)) throw new SafetyRefusalError(detail);
    throw new Error(detail);
  }

  const type = res.headers.get("content-type") || "image/jpeg";
  if (!type.startsWith("image/")) {
    const text = await res.text().catch(() => "");
    if (safetyBlocked(text)) throw new SafetyRefusalError(text.slice(0, 200));
    throw new Error("Pollinations가 이미지 데이터를 반환하지 않았습니다.");
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) {
    throw new Error("Pollinations가 빈 이미지를 반환했습니다.");
  }

  return {
    data: buf.toString("base64"),
    mimeType: type.split(";")[0] || "image/jpeg",
    model: `pollinations/${model}`,
  };
}
