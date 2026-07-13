/** 영상 URL 파싱 및 메타 보강 (YouTube oEmbed 등) */

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

export function extractFirstUrl(text: string): string | null {
  const m = text.match(URL_RE);
  return m?.[0] ?? null;
}

export function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]!;
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1]!;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export interface VideoMeta {
  url: string;
  platform: "youtube" | "other";
  videoId?: string;
  title?: string;
  author?: string;
  thumbnail?: string;
}

/**
 * 텍스트 속 URL을 찾아 메타를 붙인 프롬프트로 확장.
 * 네트워크 실패 시 원문 + URL 힌트만 반환.
 */
export async function enrichVideoSummaryPrompt(userText: string): Promise<{
  enrichedText: string;
  meta: VideoMeta | null;
}> {
  const url = extractFirstUrl(userText);
  if (!url) {
    return {
      enrichedText: userText.trim()
        ? userText
        : "첨부된 오디오·이미지·대본을 바탕으로 영상/강의 요약을 작성해 주세요.",
      meta: null,
    };
  }

  const ytId = parseYoutubeId(url);
  const meta: VideoMeta = {
    url,
    platform: ytId ? "youtube" : "other",
    videoId: ytId ?? undefined,
  };

  if (ytId) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
        };
        meta.title = data.title;
        meta.author = data.author_name;
        meta.thumbnail = data.thumbnail_url;
      }
    } catch {
      /* oEmbed 실패 시 무시 */
    }
  }

  const lines = [
    userText.trim() || "아래 영상 내용을 시스템 지침에 따라 요약·정리해 주세요.",
    "",
    "[영상 메타데이터 — 요약 시 참고]",
    `URL: ${url}`,
    meta.platform === "youtube" ? `플랫폼: YouTube` : `플랫폼: 기타`,
    meta.videoId ? `비디오 ID: ${meta.videoId}` : null,
    meta.title ? `제목: ${meta.title}` : null,
    meta.author ? `채널/작성자: ${meta.author}` : null,
    "",
    "가능하면 섹션·타임라인 단위로 정리하고, 제목·주제를 반영하세요.",
    "영상에 직접 접근이 어렵다면 제목·채널·URL·첨부 자료(대본·오디오·캡처)를 근거로 구조화하고 한계를 명시하세요.",
  ].filter((x) => x !== null);

  return { enrichedText: lines.join("\n"), meta };
}

/** 마크다운 파일로 저장할 때 붙일 헤더 */
export function exportHeader(kind: "note" | "video" | "exam" | "generic", title?: string): string {
  const label =
    kind === "note"
      ? "A4 노트"
      : kind === "video"
        ? "영상 요약"
        : kind === "exam"
          ? "모의 시험지"
          : "ZEFF 문서";
  return [
    `<!-- ZEFF AI · ${label} · ${new Date().toISOString()} -->`,
    title ? `# ${title}` : "",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}
