import PptxGenJS from "pptxgenjs";
import {
  extractJson,
  type Deck,
  type Slide,
  type SlideLayout,
} from "./fileTypes";

// ── ZEFF 브랜드 팔레트 ──
const C = {
  navy: "0B1220",
  navySoft: "111827",
  blue: "2563EB",
  blueDeep: "1D4ED8",
  indigo: "4F46E5",
  indigoSoft: "EEF2FF",
  white: "FFFFFF",
  slate50: "F8FAFC",
  slate100: "F1F5F9",
  slate500: "64748B",
  slate700: "334155",
  slate900: "0F172A",
  accentLine: "38BDF8",
} as const;

const FONT = "Arial";
const W = 13.333;
const H = 7.5;

function asLayout(v: unknown): SlideLayout {
  const s = String(v ?? "").toLowerCase();
  if (s === "agenda" || s === "toc" || s === "목차") return "agenda";
  if (s === "section" || s === "divider" || s === "섹션") return "section";
  if (s === "twocolumn" || s === "two_column" || s === "two-column" || s === "columns")
    return "twoColumn";
  if (s === "closing" || s === "end" || s === "qa" || s === "마무리") return "closing";
  return "content";
}

function cleanBullets(v: unknown, max = 6): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((b) => String(b ?? "").trim())
    .filter(Boolean)
    .slice(0, max)
    .map((b) => (b.length > 120 ? `${b.slice(0, 117)}…` : b));
}

export function parseDeck(raw: string): Deck {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(extractJson(raw)) as Record<string, unknown>;
  } catch {
    throw new Error(
      "PPT JSON 파싱에 실패했습니다. AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.",
    );
  }

  const title =
    typeof obj?.title === "string" && obj.title.trim()
      ? obj.title.trim().slice(0, 80)
      : "발표 자료";
  const subtitle =
    typeof obj?.subtitle === "string" && obj.subtitle.trim()
      ? obj.subtitle.trim().slice(0, 120)
      : undefined;

  const slides: Slide[] = Array.isArray(obj?.slides)
    ? obj.slides.map((s: unknown) => {
        const slide = (s ?? {}) as Record<string, unknown>;
        const layout = asLayout(slide.layout);
        return {
          title:
            typeof slide.title === "string" && slide.title.trim()
              ? slide.title.trim().slice(0, 80)
              : " ",
          subtitle:
            typeof slide.subtitle === "string" && slide.subtitle.trim()
              ? slide.subtitle.trim().slice(0, 120)
              : undefined,
          bullets: cleanBullets(slide.bullets, layout === "agenda" ? 8 : 6),
          bulletsRight: cleanBullets(slide.bulletsRight ?? slide.rightBullets, 5),
          notes:
            typeof slide.notes === "string" && slide.notes.trim()
              ? slide.notes.trim().slice(0, 800)
              : undefined,
          layout,
        };
      })
    : [];

  if (slides.length === 0) {
    throw new Error("슬라이드가 비어 있습니다. 주제를 조금 더 구체적으로 입력해 주세요.");
  }

  return { title, subtitle, slides: slides.slice(0, 14) };
}

function addFooter(
  slide: PptxGenJS.Slide,
  deckTitle: string,
  page: number,
  total: number,
  light = true,
) {
  const muted = light ? C.slate500 : "94A3B8";
  const line = light ? C.slate100 : "1E293B";
  slide.addShape("rect", {
    x: 0.5,
    y: H - 0.45,
    w: W - 1,
    h: 0.015,
    fill: { color: line },
    line: { color: line },
  });
  slide.addText(deckTitle.slice(0, 40), {
    x: 0.55,
    y: H - 0.4,
    w: 8,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT,
    color: muted,
  });
  slide.addText(`${page} / ${total}`, {
    x: W - 2.2,
    y: H - 0.4,
    w: 1.5,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT,
    color: muted,
    align: "right",
  });
}

function addAccentBar(slide: PptxGenJS.Slide) {
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.12,
    h: H,
    fill: { color: C.blue },
    line: { color: C.blue },
  });
}

/** Deck → .pptx base64 */
export async function buildPptxBase64(deck: Deck): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "ZEFF_WIDE", width: W, height: H });
  pptx.layout = "ZEFF_WIDE";
  pptx.author = "ZEFF AI";
  pptx.title = deck.title;
  pptx.subject = deck.subtitle || "ZEFF 생성 발표 자료";

  const bodyCount = deck.slides.length;
  // 표지 + 본문 (+ 필요 시 자동 마무리 안 함 — AI 가 closing 넣음)
  const totalPages = 1 + bodyCount;

  // ── 표지 ──
  const cover = pptx.addSlide();
  cover.background = { color: C.navy };
  // 상단 액센트
  cover.addShape("rect", {
    x: 0,
    y: 0,
    w: W,
    h: 0.08,
    fill: { color: C.blue },
    line: { color: C.blue },
  });
  // 장식 블록
  cover.addShape("rect", {
    x: W - 3.2,
    y: 0,
    w: 3.2,
    h: H,
    fill: { color: C.navySoft },
    line: { color: C.navySoft },
  });
  cover.addShape("rect", {
    x: W - 3.2,
    y: 0,
    w: 0.08,
    h: H,
    fill: { color: C.indigo },
    line: { color: C.indigo },
  });

  cover.addText("ZEFF AI", {
    x: 0.7,
    y: 1.5,
    w: 8,
    h: 0.35,
    fontSize: 12,
    fontFace: FONT,
    bold: true,
    color: C.accentLine,
    charSpacing: 4,
  });
  cover.addText(deck.title, {
    x: 0.7,
    y: 2.1,
    w: 9,
    h: 1.8,
    fontSize: 36,
    fontFace: FONT,
    bold: true,
    color: C.white,
    valign: "middle",
  });
  if (deck.subtitle) {
    cover.addText(deck.subtitle, {
      x: 0.7,
      y: 4.0,
      w: 9,
      h: 0.5,
      fontSize: 16,
      fontFace: FONT,
      color: "CBD5E1",
    });
  }
  cover.addShape("rect", {
    x: 0.7,
    y: 4.7,
    w: 1.6,
    h: 0.06,
    fill: { color: C.blue },
    line: { color: C.blue },
  });
  cover.addText("발표용 슬라이드 · ZEFF에서 생성", {
    x: 0.7,
    y: 5.1,
    w: 8,
    h: 0.35,
    fontSize: 12,
    fontFace: FONT,
    color: C.slate500,
  });
  cover.addText("1 / " + totalPages, {
    x: W - 2.2,
    y: H - 0.5,
    w: 1.5,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT,
    color: "94A3B8",
    align: "right",
  });

  // ── 본문 ──
  deck.slides.forEach((s, idx) => {
    const page = idx + 2;
    const layout = s.layout || "content";

    if (layout === "section") {
      const slide = pptx.addSlide();
      slide.background = { color: C.navy };
      slide.addShape("rect", {
        x: 0,
        y: 0,
        w: 0.18,
        h: H,
        fill: { color: C.blue },
        line: { color: C.blue },
      });
      slide.addText(`SECTION ${String(idx + 1).padStart(2, "0")}`, {
        x: 1,
        y: 2.4,
        w: 11,
        h: 0.35,
        fontSize: 12,
        fontFace: FONT,
        bold: true,
        color: C.accentLine,
        charSpacing: 3,
      });
      slide.addText(s.title || " ", {
        x: 1,
        y: 2.9,
        w: 11,
        h: 1.2,
        fontSize: 32,
        fontFace: FONT,
        bold: true,
        color: C.white,
      });
      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 1,
          y: 4.2,
          w: 11,
          h: 0.5,
          fontSize: 16,
          fontFace: FONT,
          color: "CBD5E1",
        });
      }
      if (s.notes) slide.addNotes(s.notes);
      addFooter(slide, deck.title, page, totalPages, false);
      return;
    }

    if (layout === "closing") {
      const slide = pptx.addSlide();
      slide.background = { color: C.navy };
      slide.addShape("rect", {
        x: 0,
        y: 0,
        w: W,
        h: 0.08,
        fill: { color: C.blue },
        line: { color: C.blue },
      });
      slide.addText(s.title || "감사합니다", {
        x: 0.8,
        y: 2.2,
        w: W - 1.6,
        h: 1,
        fontSize: 36,
        fontFace: FONT,
        bold: true,
        color: C.white,
        align: "center",
      });
      if (s.subtitle || (s.bullets && s.bullets[0])) {
        slide.addText(s.subtitle || s.bullets![0], {
          x: 1.5,
          y: 3.4,
          w: W - 3,
          h: 0.6,
          fontSize: 16,
          fontFace: FONT,
          color: "CBD5E1",
          align: "center",
        });
      }
      if (s.bullets && s.bullets.length > 1) {
        slide.addText(
          s.bullets.slice(1).map((b) => ({
            text: b,
            options: { bullet: false, breakLine: true },
          })),
          {
            x: 3,
            y: 4.2,
            w: W - 6,
            h: 1.8,
            fontSize: 14,
            fontFace: FONT,
            color: "94A3B8",
            align: "center",
          },
        );
      }
      if (s.notes) slide.addNotes(s.notes);
      addFooter(slide, deck.title, page, totalPages, false);
      return;
    }

    // content | agenda | twoColumn
    const slide = pptx.addSlide();
    slide.background = { color: C.white };
    addAccentBar(slide);

    // 상단 헤더 밴드
    slide.addShape("rect", {
      x: 0.12,
      y: 0,
      w: W - 0.12,
      h: 1.15,
      fill: { color: C.slate50 },
      line: { color: C.slate50 },
    });
    slide.addShape("rect", {
      x: 0.12,
      y: 1.15,
      w: W - 0.12,
      h: 0.03,
      fill: { color: C.indigoSoft },
      line: { color: C.indigoSoft },
    });

    const badge =
      layout === "agenda" ? "AGENDA" : layout === "twoColumn" ? "COMPARE" : "CONTENT";
    slide.addText(badge, {
      x: 0.55,
      y: 0.22,
      w: 2.2,
      h: 0.28,
      fontSize: 10,
      fontFace: FONT,
      bold: true,
      color: C.blue,
      charSpacing: 2,
    });
    slide.addText(s.title || " ", {
      x: 0.55,
      y: 0.48,
      w: 11.5,
      h: 0.55,
      fontSize: 24,
      fontFace: FONT,
      bold: true,
      color: C.slate900,
    });

    const bodyTop = s.subtitle ? 1.55 : 1.45;
    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 0.55,
        y: 1.2,
        w: 12,
        h: 0.35,
        fontSize: 13,
        fontFace: FONT,
        color: C.slate500,
      });
    }

    if (layout === "twoColumn") {
      const left = s.bullets?.length ? s.bullets : [];
      const right = s.bulletsRight?.length ? s.bulletsRight : [];
      // 카드 배경
      slide.addShape("roundRect", {
        x: 0.5,
        y: bodyTop,
        w: 5.9,
        h: 4.6,
        fill: { color: C.slate50 },
        line: { color: C.slate100 },
        rectRadius: 0.1,
      });
      slide.addShape("roundRect", {
        x: 6.7,
        y: bodyTop,
        w: 5.9,
        h: 4.6,
        fill: { color: C.indigoSoft },
        line: { color: C.indigoSoft },
        rectRadius: 0.1,
      });
      if (left.length) {
        slide.addText(
          left.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
          {
            x: 0.75,
            y: bodyTop + 0.25,
            w: 5.4,
            h: 4.1,
            fontSize: 15,
            fontFace: FONT,
            color: C.slate700,
            paraSpaceAfter: 10,
            valign: "top",
          },
        );
      }
      if (right.length) {
        slide.addText(
          right.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
          {
            x: 6.95,
            y: bodyTop + 0.25,
            w: 5.4,
            h: 4.1,
            fontSize: 15,
            fontFace: FONT,
            color: C.slate700,
            paraSpaceAfter: 10,
            valign: "top",
          },
        );
      }
    } else if (s.bullets && s.bullets.length > 0) {
      const useNumbers = layout === "agenda";
      slide.addText(
        s.bullets.map((b, i) => ({
          text: useNumbers ? `${i + 1}.  ${b}` : b,
          options: { bullet: !useNumbers, breakLine: true },
        })),
        {
          x: 0.7,
          y: bodyTop + 0.15,
          w: 11.8,
          h: 4.5,
          fontSize: layout === "agenda" ? 18 : 16,
          fontFace: FONT,
          color: C.slate700,
          paraSpaceAfter: 12,
          valign: "top",
        },
      );
    }

    if (s.notes) slide.addNotes(s.notes);
    addFooter(slide, deck.title, page, totalPages, true);
  });

  const out = (await pptx.write({ outputType: "base64" })) as string;
  return out;
}
