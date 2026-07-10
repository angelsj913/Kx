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

/** Workbook을 실제 .xlsx로 만들어 base64 문자열로 반환 (서버 전용) */
export async function buildXlsxBase64(wb: Workbook): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "zeff";

  const sheets = wb.sheets.length > 0 ? wb.sheets : [{ name: "시트1", columns: [], rows: [] }];

  for (const s of sheets) {
    const ws = workbook.addWorksheet(s.name || "시트");
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
