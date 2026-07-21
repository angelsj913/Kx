/** 영상 URL 파싱 및 메타·자막 보강 */

import {
  fetchYoutubeTranscript,
  chunkTranscript,
  type TranscriptResult,
} from "./youtubeTranscript";

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
  /** 자막 기반 분석 가능 여부 */
  hasTranscript?: boolean;
  transcriptLanguage?: string;
}

export interface VideoEnrichment {
  enrichedText: string;
  meta: VideoMeta | null;
  transcript: TranscriptResult | null;
  transcriptChunks: { idx: number; content: string; startSec: number }[];
}

/**
 * 텍스트 속 URL을 찾아 oEmbed 메타 + YouTube 자막을 붙인 프롬프트로 확장.
 * 자막 없으면 추측 금지 지시를 강화한다.
 */
export async function enrichVideoSummaryPrompt(userText: string): Promise<VideoEnrichment> {
  const url = extractFirstUrl(userText);
  if (!url) {
    return {
      enrichedText: userText.trim()
        ? userText
        : "첨부된 오디오·이미지·대본을 바탕으로 영상/강의 요약을 작성해 주세요.",
      meta: null,
      transcript: null,
      transcriptChunks: [],
    };
  }

  const ytId = parseYoutubeId(url);
  const meta: VideoMeta = {
    url,
    platform: ytId ? "youtube" : "other",
    videoId: ytId ?? undefined,
  };

  let transcript: TranscriptResult | null = null;

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

    try {
      transcript = await fetchYoutubeTranscript(ytId);
      if (transcript) {
        meta.hasTranscript = true;
        meta.transcriptLanguage = transcript.language;
      } else {
        meta.hasTranscript = false;
      }
    } catch {
      meta.hasTranscript = false;
    }
  }

  const transcriptChunks = transcript ? chunkTranscript(transcript.segments) : [];

  const lines = [
    userText.trim() || "아래 영상을 시스템 지침에 따라 학습 노트 형식으로 요약·정리해 주세요.",
    "",
    "[영상 메타데이터 — 반드시 반영]",
    `URL: ${url}`,
    meta.platform === "youtube" ? `플랫폼: YouTube` : `플랫폼: 기타`,
    meta.videoId ? `비디오 ID: ${meta.videoId}` : null,
    meta.title ? `제목: ${meta.title}` : null,
    meta.author ? `채널/작성자: ${meta.author}` : null,
    meta.thumbnail ? `썸네일: ${meta.thumbnail}` : null,
    meta.hasTranscript === true
      ? `자막: 있음 (${meta.transcriptLanguage ?? "unknown"}) — 아래 본문을 최우선 근거로 사용`
      : meta.hasTranscript === false
        ? "자막: 없음 — **제목·메타만으로 본문을 추측·날조하지 마세요.** 한계를 명시하고 첨부 자료만 사용"
        : null,
    "",
  ].filter((x) => x !== null);

  if (transcript?.fullText) {
    const excerpt = transcript.fullText.slice(0, 12000);
    lines.push(
      "[자막 본문 — 인용·요약의 1차 근거]",
      excerpt,
      transcript.fullText.length > 12000 ? `\n...(자막 ${transcript.fullText.length}자 중 앞 12000자)` : "",
      "",
    );
  }

  lines.push(
    "[작성 지시]",
    meta.hasTranscript
      ? "- 자막 본문을 섹션형 학습 노트로 풍부하게 작성하고, 핵심 구절을 인용하세요."
      : "- 자막·첨부·오디오가 없으면 '본문 분석 불가'를 명시하고 메타 기반 추측 요약을 하지 마세요.",
    "- 핵심 키워드·섹션별 요점·복습 질문·한 페이지 요약을 채우세요.",
    "- 첨부 대본·오디오·이미지가 있으면 자막과 함께 교차 검증하세요.",
  );

  return {
    enrichedText: lines.join("\n"),
    meta,
    transcript,
    transcriptChunks,
  };
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
