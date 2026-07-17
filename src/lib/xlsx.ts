import ExcelJS from "exceljs";
import { extractJson, type Workbook, type SheetData } from "./fileTypes";

export function parseWorkbook(raw: string): Workbook {
  const obj = JSON.parse(extractJson(raw));
  const title = typeof obj?.title === "string" ? obj.title : "보고서";
  const sheets: SheetData[] = Array.isArray(obj?.sheets)
    ? obj.sheets.map((s: unknown, i: number) => {
        const sheet = s as Record<string, unknown>;
        return {
          name:
            typeof sheet?.name === "string" && sheet.name.trim()
              ? sheet.name.slice(0, 31)
              : `시트${i + 1}`,
          columns: Array.isArray(sheet?.columns)
            ? (sheet.columns as unknown[]).map((c) => String(c))
            : [],
          rows: Array.isArray(sheet?.rows)
            ? (sheet.rows as unknown[]).map((r) =>
                Array.isArray(r)
                  ? (r as unknown[]).map((v) =>
                      typeof v === "number" ? v : String(v ?? "")
                    )
                  : [String(r ?? "")]
              )
            : [],
        };
      })
    : [];
  return { title, sheets };
}

/**
 * ExcelJS는 시트 이름에 `: / \ * ? [ ]` 문자를 금지하고, 대소문자 무시 중복도 막는다.
 * "1/4분기 실적"·"요약"(여러 시트에 반복) 같은 흔한 한국어 보고서 이름이 바로 이
 * 패턴이라, 그대로 넘기면 addWorksheet가 처리되지 않은 예외를 던진다.
 */
function sanitizeSheetName(name: string, used: Set<string>): string {
  let cleaned = (name || "시트").replace(/[:/\\*?[\]]/g, "-").slice(0, 31).trim() || "시트";
  const base = cleaned;
  let n = 2;
  while (used.has(cleaned.toLowerCase())) {
    const suffix = ` (${n})`;
    cleaned = base.slice(0, 31 - suffix.length) + suffix;
    n += 1;
  }
  used.add(cleaned.toLowerCase());
  return cleaned;
}

/** Workbook을 실제 .xlsx로 만들어 base64 문자열로 반환 (서버 전용) */
export async function buildXlsxBase64(wb: Workbook): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI 툴킷";

  const sheets = wb.sheets.length > 0 ? wb.sheets : [{ name: "시트1", columns: [], rows: [] }];
  const usedNames = new Set<string>();

  for (const s of sheets) {
    const ws = workbook.addWorksheet(sanitizeSheetName(s.name, usedNames));
    if (s.columns.length > 0) {
      const header = ws.addRow(s.columns);
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };
      header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F39F6" },
      };
      header.alignment = { vertical: "middle" };
    }
    for (const r of s.rows) {
      ws.addRow(r);
    }
    // 열 너비 자동 조정 (내용 길이 기반)
    ws.columns.forEach((col, i) => {
      let max = s.columns[i] ? String(s.columns[i]).length : 10;
      for (const r of s.rows) {
        const cell = r[i];
        if (cell != null) max = Math.max(max, String(cell).length);
      }
      col.width = Math.min(60, Math.max(12, max + 4));
    });
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer).toString("base64");
}
