import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

export interface DocxSection {
  heading?: string;
  paragraphs: string[];
}

export interface DocxInput {
  title: string;
  sections: DocxSection[];
}

/** 마크다운-ish 텍스트를 섹션으로 분할 */
export function parseMarkdownSections(text: string): DocxInput {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: DocxSection[] = [];
  let current: DocxSection = { paragraphs: [] };
  let title = "문서";

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h1 && title === "문서") {
      title = h1[1]!.trim();
      continue;
    }
    if (h2 || h3) {
      if (current.paragraphs.length || current.heading) sections.push(current);
      current = { heading: (h2 ?? h3)![1]!.trim(), paragraphs: [] };
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)/);
    if (bullet) {
      current.paragraphs.push(`• ${bullet[1]!.trim()}`);
      continue;
    }
    const trimmed = line.trim();
    if (trimmed) current.paragraphs.push(trimmed.replace(/\*\*(.+?)\*\*/g, "$1"));
  }
  if (current.paragraphs.length || current.heading) sections.push(current);
  if (!sections.length) sections.push({ paragraphs: [text.trim()] });
  return { title, sections };
}

export async function buildDocxBase64(input: DocxInput): Promise<string> {
  const children: Paragraph[] = [
    new Paragraph({
      text: input.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  for (const sec of input.sections) {
    if (sec.heading) {
      children.push(
        new Paragraph({
          text: sec.heading,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 120 },
        }),
      );
    }
    for (const p of sec.paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: p, font: "Malgun Gothic" })],
          spacing: { after: 120 },
        }),
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf).toString("base64");
}

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
