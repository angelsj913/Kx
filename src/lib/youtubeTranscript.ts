/** YouTube 자막 fetch — oEmbed 메타만으로는 환각 위험이 있어 본문 기반 분석용 */

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface TranscriptResult {
  videoId: string;
  language?: string;
  segments: TranscriptSegment[];
  fullText: string;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, " ")
    .trim();
}

function parseTimedTextXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const re = /<text start="([^"]+)" dur="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const text = decodeHtmlEntities(m[3]!.replace(/<[^>]+>/g, ""));
    if (!text) continue;
    segments.push({
      start: parseFloat(m[1]!),
      duration: parseFloat(m[2] || "0"),
      text,
    });
  }
  return segments;
}

async function fetchCaptionTracks(videoId: string): Promise<
  { baseUrl: string; languageCode: string; name?: string }[]
> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(watchUrl, {
    headers: {
      "Accept-Language": "ko,en",
      "User-Agent":
        "Mozilla/5.0 (compatible; ZEFF-AI/1.0; +https://zeffai.com)",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];

  const html = await res.text();
  const playerMatch =
    html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;\s*(?:var|<\/script)/) ??
    html.match(/"playerResponse":"(\{.+?\})"/);
  if (!playerMatch?.[1]) return [];

  let player: { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: unknown[] } } };
  try {
    const raw = playerMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    player = JSON.parse(raw) as typeof player;
  } catch {
    return [];
  }

  const tracks =
    player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  return tracks
    .map((t) => {
      const tr = t as { baseUrl?: string; languageCode?: string; name?: { simpleText?: string } };
      if (!tr.baseUrl) return null;
      return {
        baseUrl: tr.baseUrl,
        languageCode: tr.languageCode ?? "unknown",
        name: tr.name?.simpleText,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

/** 자막이 있으면 세그먼트 반환, 없으면 null */
export async function fetchYoutubeTranscript(
  videoId: string,
  preferLangs: string[] = ["ko", "en"],
): Promise<TranscriptResult | null> {
  const tracks = await fetchCaptionTracks(videoId);
  if (!tracks.length) return null;

  const sorted = [...tracks].sort((a, b) => {
    const ai = preferLangs.indexOf(a.languageCode);
    const bi = preferLangs.indexOf(b.languageCode);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const track of sorted) {
    try {
      const url = track.baseUrl.includes("fmt=")
        ? track.baseUrl
        : `${track.baseUrl}&fmt=srv3`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;
      const xml = await res.text();
      const segments = parseTimedTextXml(xml);
      if (!segments.length) continue;
      const fullText = segments.map((s) => s.text).join(" ");
      return {
        videoId,
        language: track.languageCode,
        segments,
        fullText,
      };
    } catch {
      continue;
    }
  }
  return null;
}

/** RAG 인덱싱용 타임스탬프 청크 (~90초 단위) */
export function chunkTranscript(
  segments: TranscriptSegment[],
  windowSec = 90,
): { idx: number; content: string; startSec: number }[] {
  if (!segments.length) return [];
  const chunks: { idx: number; content: string; startSec: number }[] = [];
  let buf: string[] = [];
  let chunkStart = segments[0]!.start;
  let idx = 0;

  for (const seg of segments) {
    if (seg.start - chunkStart >= windowSec && buf.length) {
      chunks.push({
        idx: idx++,
        content: buf.join(" ").trim(),
        startSec: Math.floor(chunkStart),
      });
      buf = [];
      chunkStart = seg.start;
    }
    buf.push(seg.text);
  }
  if (buf.length) {
    chunks.push({
      idx,
      content: buf.join(" ").trim(),
      startSec: Math.floor(chunkStart),
    });
  }
  return chunks.filter((c) => c.content.length > 20);
}
