import { extractText, getDocumentProxy } from "unpdf";

/**
 * PDF에 이미 들어 있는 텍스트 레이어를 AI 없이 바로 추출한다.
 * 대부분의 전자 문서(정부 서식·워드→PDF 등)는 텍스트 레이어가 있어 이 경로만으로
 * 충분하다 — 멀티모달 LLM(OCR) 호출을 아끼고, Gemini 크레딧이 없어도 동작한다.
 * 스캔 이미지 PDF는 텍스트 레이어가 없어 빈 문자열을 돌려주고, 호출 측에서 OCR로 폴백한다.
 */
export async function extractPdfText(buf: Buffer): Promise<string> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    // mergePages: true → text 는 페이지를 합친 단일 문자열.
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  } catch (err) {
    console.warn("[pdfText] text-layer extract failed:", err);
    return "";
  }
}

/** 텍스트 레이어가 "실질적인 내용"을 담고 있는지(스캔본의 빈/잡음 텍스트 구분). */
export function hasUsableText(text: string): boolean {
  return text.trim().length >= 100;
}
