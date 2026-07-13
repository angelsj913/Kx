import PptxGenJS from "pptxgenjs";
import {
  extractJson,
  type Deck,
  type DeckTheme,
  type Slide,
  type SlideDiagram,
  type SlideLayout,
  type SlideTable,
} from "./fileTypes";

const FONT = "Arial";
const W = 13.333;
const H = 7.5;

export interface ResolvedPalette {
  primary: string;
  secondary: string;
  accent: string;
  primarySoft: string;
  text: string;
  muted: string;
  white: string;
  surface: string;
  surfaceAlt: string;
  name: string;
}

/** 주제별 기본 팔레트 */
const PRESETS: Record<string, ResolvedPalette> = {
  science: {
    name: "science",
    primary: "0369A1",
    secondary: "0C4A6E",
    accent: "22D3EE",
    primarySoft: "E0F2FE",
    text: "0F172A",
    muted: "64748B",
    white: "FFFFFF",
    surface: "F0F9FF",
    surfaceAlt: "F8FAFC",
  },
  nature: {
    name: "nature",
    primary: "15803D",
    secondary: "14532D",
    accent: "4ADE80",
    primarySoft: "DCFCE7",
    text: "14532D",
    muted: "4B5563",
    white: "FFFFFF",
    surface: "F0FDF4",
    surfaceAlt: "F8FAFC",
  },
  medical: {
    name: "medical",
    primary: "0D9488",
    secondary: "134E4A",
    accent: "5EEAD4",
    primarySoft: "CCFBF1",
    text: "134E4A",
    muted: "64748B",
    white: "FFFFFF",
    surface: "F0FDFA",
    surfaceAlt: "F8FAFC",
  },
  business: {
    name: "business",
    primary: "1E3A8A",
    secondary: "0F172A",
    accent: "F59E0B",
    primarySoft: "DBEAFE",
    text: "0F172A",
    muted: "64748B",
    white: "FFFFFF",
    surface: "EFF6FF",
    surfaceAlt: "F8FAFC",
  },
  tech: {
    name: "tech",
    primary: "6D28D9",
    secondary: "1E1B4B",
    accent: "A78BFA",
    primarySoft: "EDE9FE",
    text: "1E1B4B",
    muted: "64748B",
    white: "FFFFFF",
    surface: "F5F3FF",
    surfaceAlt: "F8FAFC",
  },
  education: {
    name: "education",
    primary: "2563EB",
    secondary: "1E3A8A",
    accent: "FBBF24",
    primarySoft: "DBEAFE",
    text: "0F172A",
    muted: "64748B",
    white: "FFFFFF",
    surface: "EFF6FF",
    surfaceAlt: "F8FAFC",
  },
  creative: {
    name: "creative",
    primary: "DB2777",
    secondary: "831843",
    accent: "F472B6",
    primarySoft: "FCE7F3",
    text: "831843",
    muted: "64748B",
    white: "FFFFFF",
    surface: "FDF2F8",
    surfaceAlt: "F8FAFC",
  },
  energy: {
    name: "energy",
    primary: "EA580C",
    secondary: "7C2D12",
    accent: "FDBA74",
    primarySoft: "FFEDD5",
    text: "7C2D12",
    muted: "64748B",
    white: "FFFFFF",
    surface: "FFF7ED",
    surfaceAlt: "F8FAFC",
  },
  finance: {
    name: "finance",
    primary: "0F766E",
    secondary: "042F2E",
    accent: "34D399",
    primarySoft: "D1FAE5",
    text: "042F2E",
    muted: "64748B",
    white: "FFFFFF",
    surface: "ECFDF5",
    surfaceAlt: "F8FAFC",
  },
  default: {
    name: "default",
    primary: "2563EB",
    secondary: "0B1220",
    accent: "38BDF8",
    primarySoft: "EEF2FF",
    text: "0F172A",
    muted: "64748B",
    white: "FFFFFF",
    surface: "F8FAFC",
    surfaceAlt: "F1F5F9",
  },
};

function hex(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  let s = raw.trim().replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{3}$/.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return /^[0-9A-F]{6}$/.test(s) ? s : fallback;
}

/** 키워드로 테마 추정 (AI가 preset 안 줄 때) */
export function inferThemePreset(title: string, subtitle?: string): string {
  const t = `${title} ${subtitle ?? ""}`.toLowerCase();
  if (/세포|생물|물리|화학|과학|우주|실험|분자|유전자|분열/.test(t)) return "science";
  if (/환경|자연|생태|기후|식물|숲|지구|그린/.test(t)) return "nature";
  if (/의학|건강|병원|간호|질병|약|의료|해부/.test(t)) return "medical";
  if (/마케팅|경영|전략|매출|사업|회사|스타트업|조직/.test(t)) return "business";
  if (/ai|인공|소프트웨어|코딩|앱|디지털|it|기술|데이터|알고리즘/.test(t)) return "tech";
  if (/교육|학교|수업|학습|입시|공부|강의|학생/.test(t)) return "education";
  if (/예술|디자인|문화|음악|영화|창의/.test(t)) return "creative";
  if (/에너지|전력|태양광|배터리|탄소/.test(t)) return "energy";
  if (/금융|투자|경제|주식|회계|예산/.test(t)) return "finance";
  return "default";
}

export function resolvePalette(theme: DeckTheme | undefined, title: string, subtitle?: string): ResolvedPalette {
  const presetKey = String(theme?.preset || inferThemePreset(title, subtitle)).toLowerCase();
  const base = PRESETS[presetKey] ?? PRESETS.default;
  return {
    ...base,
    primary: hex(theme?.primary, base.primary),
    secondary: hex(theme?.secondary, base.secondary),
    accent: hex(theme?.accent, base.accent),
  };
}

function asLayout(v: unknown, hasTable: boolean, hasDiagram: boolean): SlideLayout {
  const s = String(v ?? "").toLowerCase();
  if (s === "agenda" || s === "toc" || s === "목차") return "agenda";
  if (s === "section" || s === "divider" || s === "섹션") return "section";
  if (s === "twocolumn" || s === "two_column" || s === "two-column" || s === "columns")
    return "twoColumn";
  if (s === "closing" || s === "end" || s === "qa" || s === "마무리") return "closing";
  if (s === "table" || s === "표") return "table";
  if (s === "process" || s === "flow" || s === "단계") return "process";
  if (s === "cycle" || s === "순환") return "cycle";
  if (s === "cards" || s === "card" || s === "카드") return "cards";
  if (hasTable && !s) return "table";
  if (hasDiagram && (s === "content" || !s)) return "process";
  return "content";
}

function cleanBullets(v: unknown, max = 8): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((b) => String(b ?? "").trim())
    .filter(Boolean)
    .slice(0, max)
    .map((b) => (b.length > 140 ? `${b.slice(0, 137)}…` : b));
}

function parseTable(v: unknown): SlideTable | undefined {
  if (!v || typeof v !== "object") return undefined;
  const t = v as Record<string, unknown>;
  const headers = Array.isArray(t.headers)
    ? t.headers.map((h) => String(h ?? "").trim()).filter(Boolean).slice(0, 8)
    : [];
  const rows = Array.isArray(t.rows)
    ? t.rows
        .map((r) =>
          Array.isArray(r)
            ? r.map((c) => String(c ?? "").trim()).slice(0, 8)
            : [String(r ?? "")],
        )
        .filter((r) => r.some(Boolean))
        .slice(0, 10)
    : [];
  if (!headers.length || !rows.length) return undefined;
  // 열 수 맞춤
  const cols = headers.length;
  return {
    headers,
    rows: rows.map((r) => {
      const out = r.slice(0, cols);
      while (out.length < cols) out.push("");
      return out;
    }),
  };
}

function parseDiagram(v: unknown): SlideDiagram | undefined {
  if (!v || typeof v !== "object") return undefined;
  const d = v as Record<string, unknown>;
  const type = String(d.type ?? "process").toLowerCase();
  const stepsRaw = Array.isArray(d.steps) ? d.steps : Array.isArray(d.items) ? d.items : [];
  const steps = stepsRaw
    .map((s) => {
      if (typeof s === "string") return { label: s.trim(), desc: undefined };
      const o = (s ?? {}) as Record<string, unknown>;
      const label = String(o.label ?? o.title ?? o.name ?? "").trim();
      const desc = String(o.desc ?? o.description ?? o.detail ?? "").trim();
      return label ? { label: label.slice(0, 40), desc: desc ? desc.slice(0, 60) : undefined } : null;
    })
    .filter(Boolean) as { label: string; desc?: string }[];
  if (steps.length < 2) return undefined;
  return { type, steps: steps.slice(0, 6) };
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

  let theme: DeckTheme | undefined;
  if (obj.theme && typeof obj.theme === "object") {
    const th = obj.theme as Record<string, unknown>;
    theme = {
      preset: typeof th.preset === "string" ? th.preset : undefined,
      primary: typeof th.primary === "string" ? th.primary : undefined,
      secondary: typeof th.secondary === "string" ? th.secondary : undefined,
      accent: typeof th.accent === "string" ? th.accent : undefined,
    };
  } else if (typeof obj.theme === "string") {
    theme = { preset: obj.theme };
  }

  const slides: Slide[] = Array.isArray(obj?.slides)
    ? obj.slides.map((s: unknown) => {
        const slide = (s ?? {}) as Record<string, unknown>;
        const table = parseTable(slide.table);
        const diagram = parseDiagram(slide.diagram);
        const layout = asLayout(slide.layout, !!table, !!diagram);
        return {
          title:
            typeof slide.title === "string" && slide.title.trim()
              ? slide.title.trim().slice(0, 80)
              : " ",
          subtitle:
            typeof slide.subtitle === "string" && slide.subtitle.trim()
              ? slide.subtitle.trim().slice(0, 140)
              : undefined,
          bullets: cleanBullets(slide.bullets, layout === "agenda" ? 9 : 8),
          bulletsRight: cleanBullets(slide.bulletsRight ?? slide.rightBullets, 6),
          notes:
            typeof slide.notes === "string" && slide.notes.trim()
              ? slide.notes.trim().slice(0, 1000)
              : undefined,
          layout,
          table,
          diagram,
        };
      })
    : [];

  if (slides.length === 0) {
    throw new Error("슬라이드가 비어 있습니다. 주제를 조금 더 구체적으로 입력해 주세요.");
  }

  return { title, subtitle, theme, slides: slides.slice(0, 16) };
}

function addFooter(
  slide: PptxGenJS.Slide,
  deckTitle: string,
  page: number,
  total: number,
  pal: ResolvedPalette,
  light = true,
) {
  const muted = light ? pal.muted : "94A3B8";
  const line = light ? pal.surfaceAlt : "1E293B";
  slide.addShape("rect", {
    x: 0.5,
    y: H - 0.42,
    w: W - 1,
    h: 0.012,
    fill: { color: line },
    line: { color: line },
  });
  slide.addText(deckTitle.slice(0, 40), {
    x: 0.55,
    y: H - 0.38,
    w: 8,
    h: 0.28,
    fontSize: 9,
    fontFace: FONT,
    color: muted,
  });
  slide.addText(`${page} / ${total}`, {
    x: W - 2.2,
    y: H - 0.38,
    w: 1.5,
    h: 0.28,
    fontSize: 9,
    fontFace: FONT,
    color: muted,
    align: "right",
  });
}

function addAccentBar(slide: PptxGenJS.Slide, pal: ResolvedPalette) {
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.12,
    h: H,
    fill: { color: pal.primary },
    line: { color: pal.primary },
  });
}

function addHeaderBand(
  slide: PptxGenJS.Slide,
  pal: ResolvedPalette,
  badge: string,
  title: string,
  subtitle?: string,
) {
  slide.addShape("rect", {
    x: 0.12,
    y: 0,
    w: W - 0.12,
    h: subtitle ? 1.25 : 1.1,
    fill: { color: pal.surface },
    line: { color: pal.surface },
  });
  slide.addShape("rect", {
    x: 0.12,
    y: subtitle ? 1.25 : 1.1,
    w: W - 0.12,
    h: 0.03,
    fill: { color: pal.primarySoft },
    line: { color: pal.primarySoft },
  });
  slide.addText(badge, {
    x: 0.55,
    y: 0.18,
    w: 3,
    h: 0.26,
    fontSize: 10,
    fontFace: FONT,
    bold: true,
    color: pal.primary,
    charSpacing: 2,
  });
  slide.addText(title || " ", {
    x: 0.55,
    y: 0.42,
    w: 12,
    h: 0.5,
    fontSize: 22,
    fontFace: FONT,
    bold: true,
    color: pal.text,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55,
      y: 0.9,
      w: 12,
      h: 0.3,
      fontSize: 12,
      fontFace: FONT,
      color: pal.muted,
    });
  }
}

function drawTable(
  slide: PptxGenJS.Slide,
  table: SlideTable,
  pal: ResolvedPalette,
  y: number,
) {
  const rows: PptxGenJS.TableRow[] = [
    table.headers.map((h) => ({
      text: h,
      options: {
        bold: true,
        color: pal.white,
        fill: { color: pal.primary },
        align: "center",
        valign: "middle",
      },
    })),
    ...table.rows.map((row, ri) =>
      row.map((cell) => ({
        text: cell,
        options: {
          color: pal.text,
          fill: { color: ri % 2 === 0 ? pal.white : pal.surface },
          align: "center" as const,
          valign: "middle" as const,
        },
      })),
    ),
  ];
  slide.addTable(rows, {
    x: 0.55,
    y,
    w: W - 1.1,
    colW: table.headers.map(() => (W - 1.1) / table.headers.length),
    border: [
      { pt: 0.5, color: pal.primarySoft },
      { pt: 0.5, color: pal.primarySoft },
      { pt: 0.5, color: pal.primarySoft },
      { pt: 0.5, color: pal.primarySoft },
    ],
    fontFace: FONT,
    fontSize: 12,
    rowH: 0.42,
  });
}

function drawProcess(
  slide: PptxGenJS.Slide,
  steps: { label: string; desc?: string }[],
  pal: ResolvedPalette,
  y: number,
) {
  const n = Math.min(steps.length, 5);
  const gap = 0.18;
  const boxW = (W - 1.1 - gap * (n - 1)) / n;
  const boxH = 2.4;
  for (let i = 0; i < n; i++) {
    const x = 0.55 + i * (boxW + gap);
    slide.addShape("roundRect", {
      x,
      y,
      w: boxW,
      h: boxH,
      fill: { color: i % 2 === 0 ? pal.primarySoft : pal.surface },
      line: { color: pal.primary, pt: 1.2 },
      rectRadius: 0.1,
    });
    slide.addShape("ellipse", {
      x: x + boxW / 2 - 0.28,
      y: y + 0.22,
      w: 0.56,
      h: 0.56,
      fill: { color: pal.primary },
      line: { color: pal.primary },
    });
    slide.addText(String(i + 1), {
      x: x + boxW / 2 - 0.28,
      y: y + 0.28,
      w: 0.56,
      h: 0.45,
      fontSize: 14,
      fontFace: FONT,
      bold: true,
      color: pal.white,
      align: "center",
    });
    slide.addText(steps[i]!.label, {
      x: x + 0.12,
      y: y + 0.95,
      w: boxW - 0.24,
      h: 0.7,
      fontSize: 13,
      fontFace: FONT,
      bold: true,
      color: pal.text,
      align: "center",
      valign: "top",
    });
    if (steps[i]!.desc) {
      slide.addText(steps[i]!.desc!, {
        x: x + 0.12,
        y: y + 1.65,
        w: boxW - 0.24,
        h: 0.55,
        fontSize: 11,
        fontFace: FONT,
        color: pal.muted,
        align: "center",
        valign: "top",
      });
    }
    if (i < n - 1) {
      slide.addText("→", {
        x: x + boxW - 0.05,
        y: y + boxH / 2 - 0.2,
        w: gap + 0.1,
        h: 0.4,
        fontSize: 18,
        color: pal.primary,
        align: "center",
      });
    }
  }
}

function drawCycle(
  slide: PptxGenJS.Slide,
  steps: { label: string; desc?: string }[],
  pal: ResolvedPalette,
  y: number,
) {
  const n = Math.min(steps.length, 4);
  const positions =
    n === 2
      ? [
          [1.5, y],
          [7.5, y],
        ]
      : n === 3
        ? [
            [4.8, y],
            [1.5, y + 2.2],
            [8.1, y + 2.2],
          ]
        : [
            [1.2, y],
            [7.2, y],
            [7.2, y + 2.3],
            [1.2, y + 2.3],
          ];
  for (let i = 0; i < n; i++) {
    const [x, yy] = positions[i] as [number, number];
    slide.addShape("roundRect", {
      x,
      y: yy,
      w: 4.8,
      h: 1.9,
      fill: { color: pal.primarySoft },
      line: { color: pal.primary, pt: 1.5 },
      rectRadius: 0.12,
    });
    slide.addText(`${i + 1}. ${steps[i]!.label}`, {
      x: x + 0.25,
      y: yy + 0.35,
      w: 4.3,
      h: 0.55,
      fontSize: 15,
      fontFace: FONT,
      bold: true,
      color: pal.text,
    });
    if (steps[i]!.desc) {
      slide.addText(steps[i]!.desc!, {
        x: x + 0.25,
        y: yy + 0.95,
        w: 4.3,
        h: 0.7,
        fontSize: 12,
        fontFace: FONT,
        color: pal.muted,
      });
    }
  }
}

function drawCards(
  slide: PptxGenJS.Slide,
  steps: { label: string; desc?: string }[],
  pal: ResolvedPalette,
  y: number,
) {
  const n = Math.min(steps.length, 6);
  const cols = n <= 3 ? n : 3;
  const rows = Math.ceil(n / cols);
  const gap = 0.22;
  const boxW = (W - 1.1 - gap * (cols - 1)) / cols;
  const boxH = Math.min(2.6, (4.8 - gap * (rows - 1)) / rows);
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.55 + col * (boxW + gap);
    const yy = y + row * (boxH + gap);
    slide.addShape("roundRect", {
      x,
      y: yy,
      w: boxW,
      h: boxH,
      fill: { color: row % 2 === 0 ? pal.primarySoft : pal.surface },
      line: { color: pal.primarySoft },
      rectRadius: 0.1,
    });
    slide.addShape("rect", {
      x,
      y: yy,
      w: 0.12,
      h: boxH,
      fill: { color: pal.primary },
      line: { color: pal.primary },
    });
    slide.addText(steps[i]!.label, {
      x: x + 0.3,
      y: yy + 0.25,
      w: boxW - 0.45,
      h: 0.55,
      fontSize: 14,
      fontFace: FONT,
      bold: true,
      color: pal.text,
    });
    if (steps[i]!.desc) {
      slide.addText(steps[i]!.desc!, {
        x: x + 0.3,
        y: yy + 0.9,
        w: boxW - 0.45,
        h: boxH - 1.15,
        fontSize: 12,
        fontFace: FONT,
        color: pal.muted,
        valign: "top",
      });
    }
  }
}

/** Deck → .pptx base64 */
export async function buildPptxBase64(deck: Deck): Promise<string> {
  const pal = resolvePalette(deck.theme, deck.title, deck.subtitle);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "ZEFF_WIDE", width: W, height: H });
  pptx.layout = "ZEFF_WIDE";
  pptx.author = "ZEFF AI";
  pptx.title = deck.title;
  pptx.subject = deck.subtitle || `ZEFF · ${pal.name}`;

  const bodyCount = deck.slides.length;
  const totalPages = 1 + bodyCount;

  // ── 표지 ──
  const cover = pptx.addSlide();
  cover.background = { color: pal.secondary };
  cover.addShape("rect", {
    x: 0,
    y: 0,
    w: W,
    h: 0.1,
    fill: { color: pal.primary },
    line: { color: pal.primary },
  });
  cover.addShape("rect", {
    x: W - 3.4,
    y: 0,
    w: 3.4,
    h: H,
    fill: { color: pal.primary },
    line: { color: pal.primary },
  });
  // 장식 원
  cover.addShape("ellipse", {
    x: W - 2.8,
    y: 2.2,
    w: 2.2,
    h: 2.2,
    fill: { color: pal.accent },
    line: { color: pal.accent },
  });
  cover.addText("ZEFF AI", {
    x: 0.75,
    y: 1.55,
    w: 8,
    h: 0.35,
    fontSize: 12,
    fontFace: FONT,
    bold: true,
    color: pal.accent,
    charSpacing: 4,
  });
  cover.addText(deck.title, {
    x: 0.75,
    y: 2.15,
    w: 8.5,
    h: 1.7,
    fontSize: 34,
    fontFace: FONT,
    bold: true,
    color: pal.white,
    valign: "middle",
  });
  if (deck.subtitle) {
    cover.addText(deck.subtitle, {
      x: 0.75,
      y: 4.0,
      w: 8.5,
      h: 0.45,
      fontSize: 15,
      fontFace: FONT,
      color: "CBD5E1",
    });
  }
  cover.addShape("rect", {
    x: 0.75,
    y: 4.65,
    w: 1.8,
    h: 0.07,
    fill: { color: pal.accent },
    line: { color: pal.accent },
  });
  cover.addText(`테마 · ${pal.name}  ·  발표용 슬라이드`, {
    x: 0.75,
    y: 5.0,
    w: 8,
    h: 0.35,
    fontSize: 12,
    fontFace: FONT,
    color: "94A3B8",
  });
  cover.addText(`1 / ${totalPages}`, {
    x: W - 2.2,
    y: H - 0.5,
    w: 1.5,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT,
    color: "E2E8F0",
    align: "right",
  });

  // ── 본문 ──
  deck.slides.forEach((s, idx) => {
    const page = idx + 2;
    const layout = s.layout || "content";

    if (layout === "section") {
      const slide = pptx.addSlide();
      slide.background = { color: pal.secondary };
      slide.addShape("rect", {
        x: 0,
        y: 0,
        w: 0.2,
        h: H,
        fill: { color: pal.primary },
        line: { color: pal.primary },
      });
      slide.addText(`SECTION ${String(idx + 1).padStart(2, "0")}`, {
        x: 1,
        y: 2.35,
        w: 11,
        h: 0.35,
        fontSize: 12,
        fontFace: FONT,
        bold: true,
        color: pal.accent,
        charSpacing: 3,
      });
      slide.addText(s.title || " ", {
        x: 1,
        y: 2.85,
        w: 11,
        h: 1.2,
        fontSize: 30,
        fontFace: FONT,
        bold: true,
        color: pal.white,
      });
      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 1,
          y: 4.15,
          w: 11,
          h: 0.5,
          fontSize: 15,
          fontFace: FONT,
          color: "CBD5E1",
        });
      }
      if (s.notes) slide.addNotes(s.notes);
      addFooter(slide, deck.title, page, totalPages, pal, false);
      return;
    }

    if (layout === "closing") {
      const slide = pptx.addSlide();
      slide.background = { color: pal.secondary };
      slide.addShape("rect", {
        x: 0,
        y: 0,
        w: W,
        h: 0.1,
        fill: { color: pal.primary },
        line: { color: pal.primary },
      });
      slide.addText(s.title || "감사합니다", {
        x: 0.8,
        y: 2.0,
        w: W - 1.6,
        h: 0.9,
        fontSize: 34,
        fontFace: FONT,
        bold: true,
        color: pal.white,
        align: "center",
      });
      if (s.subtitle || s.bullets?.[0]) {
        slide.addText(s.subtitle || s.bullets![0]!, {
          x: 1.5,
          y: 3.1,
          w: W - 3,
          h: 0.5,
          fontSize: 16,
          fontFace: FONT,
          color: "CBD5E1",
          align: "center",
        });
      }
      const rest = s.bullets?.slice(s.subtitle ? 0 : 1) ?? [];
      if (rest.length) {
        slide.addText(
          rest.map((b) => ({ text: b, options: { breakLine: true } })),
          {
            x: 2.5,
            y: 3.9,
            w: W - 5,
            h: 2,
            fontSize: 14,
            fontFace: FONT,
            color: "94A3B8",
            align: "center",
          },
        );
      }
      if (s.notes) slide.addNotes(s.notes);
      addFooter(slide, deck.title, page, totalPages, pal, false);
      return;
    }

    const slide = pptx.addSlide();
    slide.background = { color: pal.white };
    addAccentBar(slide, pal);

    const badge =
      layout === "agenda"
        ? "AGENDA"
        : layout === "twoColumn"
          ? "COMPARE"
          : layout === "table"
            ? "TABLE"
            : layout === "process"
              ? "PROCESS"
              : layout === "cycle"
                ? "CYCLE"
                : layout === "cards"
                  ? "CARDS"
                  : "CONTENT";

    addHeaderBand(slide, pal, badge, s.title || " ", s.subtitle);
    const bodyTop = s.subtitle ? 1.55 : 1.4;

    // 표
    if (s.table && (layout === "table" || s.table.rows.length > 0)) {
      const tableY = bodyTop + (s.bullets?.length ? 1.6 : 0.15);
      if (s.bullets?.length) {
        slide.addText(
          s.bullets.slice(0, 4).map((b) => ({
            text: b,
            options: { bullet: true, breakLine: true },
          })),
          {
            x: 0.6,
            y: bodyTop,
            w: 12,
            h: 1.4,
            fontSize: 13,
            fontFace: FONT,
            color: pal.text,
            paraSpaceAfter: 6,
            valign: "top",
          },
        );
      }
      drawTable(slide, s.table, pal, tableY);
    }
    // 다이어그램
    else if (s.diagram && s.diagram.steps.length >= 2) {
      const dtype = String(s.diagram.type || layout).toLowerCase();
      if (s.bullets?.length) {
        slide.addText(
          s.bullets.slice(0, 3).map((b) => ({
            text: b,
            options: { bullet: true, breakLine: true },
          })),
          {
            x: 0.6,
            y: bodyTop,
            w: 12,
            h: 0.9,
            fontSize: 13,
            fontFace: FONT,
            color: pal.text,
            paraSpaceAfter: 4,
            valign: "top",
          },
        );
      }
      const dy = bodyTop + (s.bullets?.length ? 1.0 : 0.2);
      if (dtype === "cycle") drawCycle(slide, s.diagram.steps, pal, dy);
      else if (dtype === "cards" || layout === "cards")
        drawCards(slide, s.diagram.steps, pal, dy);
      else drawProcess(slide, s.diagram.steps, pal, dy);
    }
    // 2열
    else if (layout === "twoColumn") {
      const left = s.bullets ?? [];
      const right = s.bulletsRight ?? [];
      slide.addShape("roundRect", {
        x: 0.5,
        y: bodyTop,
        w: 5.95,
        h: 4.55,
        fill: { color: pal.surface },
        line: { color: pal.primarySoft },
        rectRadius: 0.1,
      });
      slide.addShape("roundRect", {
        x: 6.7,
        y: bodyTop,
        w: 5.95,
        h: 4.55,
        fill: { color: pal.primarySoft },
        line: { color: pal.primarySoft },
        rectRadius: 0.1,
      });
      if (left.length) {
        slide.addText(
          left.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
          {
            x: 0.75,
            y: bodyTop + 0.25,
            w: 5.45,
            h: 4.1,
            fontSize: 14,
            fontFace: FONT,
            color: pal.text,
            paraSpaceAfter: 8,
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
            w: 5.45,
            h: 4.1,
            fontSize: 14,
            fontFace: FONT,
            color: pal.text,
            paraSpaceAfter: 8,
            valign: "top",
          },
        );
      }
    }
    // 일반 / 목차 불릿 (빽빽하게)
    else if (s.bullets && s.bullets.length > 0) {
      const useNumbers = layout === "agenda";
      slide.addText(
        s.bullets.map((b, i) => ({
          text: useNumbers ? `${i + 1}.  ${b}` : b,
          options: { bullet: !useNumbers, breakLine: true },
        })),
        {
          x: 0.65,
          y: bodyTop + 0.1,
          w: 12,
          h: 4.7,
          fontSize: layout === "agenda" ? 16 : 14,
          fontFace: FONT,
          color: pal.text,
          paraSpaceAfter: 8,
          valign: "top",
        },
      );
    }

    if (s.notes) slide.addNotes(s.notes);
    addFooter(slide, deck.title, page, totalPages, pal, true);
  });

  return (await pptx.write({ outputType: "base64" })) as string;
}
