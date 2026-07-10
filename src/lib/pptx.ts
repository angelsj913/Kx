import PptxGenJS from "pptxgenjs";
import { extractJson, type Deck, type Slide } from "./fileTypes";

export function parseDeck(raw: string): Deck {
  const obj = JSON.parse(extractJson(raw));
  const title = typeof obj?.title === "string" ? obj.title : "발표 자료";
  const slides: Slide[] = Array.isArray(obj?.slides)
    ? obj.slides.map((s: unknown) => {
        const slide = s as Record<string, unknown>;
        return {
          title: typeof slide?.title === "string" ? slide.title : "",
          bullets: Array.isArray(slide?.bullets)
            ? (slide.bullets as unknown[]).map((b) => String(b))
            : [],
          notes: typeof slide?.notes === "string" ? slide.notes : undefined,
        };
      })
    : [];
  return { title, slides };
}

/** Deck을 실제 .pptx로 만들어 base64 문자열로 반환 (서버 전용) */
export async function buildPptxBase64(deck: Deck): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  // 표지
  const cover = pptx.addSlide();
  cover.background = { color: "0F172B" };
  cover.addText(deck.title, {
    x: 0.5,
    y: 2.4,
    w: 12.3,
    h: 1.6,
    fontSize: 40,
    bold: true,
    color: "FFFFFF",
    align: "center",
  });
  cover.addText("zeff로 생성한 발표 초안", {
    x: 0.5,
    y: 4.1,
    w: 12.3,
    h: 0.6,
    fontSize: 16,
    color: "A685FF",
    align: "center",
  });

  // 본문 슬라이드
  for (const s of deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText(s.title || " ", {
      x: 0.6,
      y: 0.4,
      w: 12.1,
      h: 0.9,
      fontSize: 26,
      bold: true,
      color: "4F39F6",
    });
    if (s.bullets && s.bullets.length > 0) {
      slide.addText(
        s.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        {
          x: 0.8,
          y: 1.6,
          w: 11.7,
          h: 5.2,
          fontSize: 18,
          color: "1D293D",
          lineSpacingMultiple: 1.3,
          valign: "top",
        }
      );
    }
    if (s.notes) slide.addNotes(s.notes);
  }

  const out = (await pptx.write({ outputType: "base64" })) as string;
  return out;
}
