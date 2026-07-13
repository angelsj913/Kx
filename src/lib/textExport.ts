/** 클라이언트 텍스트/마크다운 다운로드·인쇄 유틸 */

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(filenameBase: string, markdown: string) {
  const name = filenameBase.endsWith(".md") ? filenameBase : `${filenameBase}.md`;
  downloadTextFile(name, markdown, "text/markdown;charset=utf-8");
}

/** 브라우저 인쇄 → PDF 저장용 HTML 창 */
export function openPrintableHtml(title: string, markdown: string) {
  // 간단한 마크다운 → HTML (제목/목록/굵게 정도)
  const htmlBody = markdownToSimpleHtml(markdown);
  const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: "Noto Sans KR", "Malgun Gothic", sans-serif; font-size: 11pt; line-height: 1.65; color: #0f172a; max-width: 700px; margin: 24px auto; padding: 0 16px; }
    h1 { font-size: 18pt; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
    h2 { font-size: 14pt; margin-top: 1.4em; color: #1e40af; }
    h3 { font-size: 12pt; margin-top: 1.1em; }
    ul, ol { padding-left: 1.4em; }
    code { background: #f1f5f9; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.92em; }
    pre { background: #f8fafc; padding: 12px; border-radius: 8px; overflow: auto; white-space: pre-wrap; }
    hr { border: none; border-top: 1px dashed #cbd5e1; margin: 1.5em 0; page-break-after: always; }
    .meta { color: #64748b; font-size: 9pt; margin-bottom: 1.5em; }
  </style>
</head>
<body>
  <p class="meta">ZEFF AI · ${escapeHtml(title)} · ${new Date().toLocaleString("ko-KR")}</p>
  ${htmlBody}
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body>
</html>`);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToSimpleHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let inPre = false;

  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw;
    if (line.startsWith("```")) {
      flushList();
      if (inPre) {
        out.push("</pre>");
        inPre = false;
      } else {
        out.push("<pre>");
        inPre = true;
      }
      continue;
    }
    if (inPre) {
      out.push(escapeHtml(line));
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      flushList();
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const text = line.replace(/^#+\s*/, "");
      out.push(`<h${level}>${inlineMd(text)}</h${level}>`);
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushList();
      out.push("<hr />");
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inlineMd(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      flushList();
      out.push("<br />");
      continue;
    }
    flushList();
    out.push(`<p>${inlineMd(line)}</p>`);
  }
  flushList();
  if (inPre) out.push("</pre>");
  return out.join("\n");
}

function inlineMd(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
