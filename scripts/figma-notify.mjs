#!/usr/bin/env node
/**
 * main 브랜치에 병합될 때마다 Figma 파일에 "홈페이지 코드가 바뀌었다"는
 * 알림 댓글을 남긴다. Vercel은 git 연동으로 배포 자체를 자동화해주지만,
 * Figma REST API는 레이어/디자인을 코드로 재생성하는 쓰기 기능을 제공하지
 * 않는다(그건 Figma 플러그인 실행 환경, 즉 Cursor의 Figma MCP에서만 가능).
 *
 * 그래서 이 스크립트는 "완전 자동 디자인 동기화"의 가장 현실적인 대안으로,
 * 커밋 정보 + 최신 배포 URL을 Figma 파일 댓글로 남겨 디자이너가 바로 알 수
 * 있게 한다. 실제 화면을 Figma에 다시 반영하려면 Cursor 에이전트에게
 * "피그마에 홈페이지 다시 가져와줘"라고 요청해서 재캡처하면 된다.
 *
 * 필요한 값 (GitHub Actions Secrets/Variables 로 주입):
 *  - FIGMA_ACCESS_TOKEN : Figma 개인 액세스 토큰 (file_comments:write scope만 있으면 됨)
 *  - FIGMA_FILE_KEY      : 알림을 남길 Figma 파일 키
 * 둘 중 하나라도 없으면 조용히 건너뛴다(로컬 개발 중 실수로 실행돼도 안전).
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function loadProjectEnv() {
  const root = process.cwd();
  const envPath = resolve(root, ".env");
  const envLocalPath = resolve(root, ".env.local");
  if (existsSync(envPath)) loadEnv({ path: envPath });
  if (existsSync(envLocalPath)) loadEnv({ path: envLocalPath, override: true });
}

function buildMessage() {
  const sha = (process.env.GITHUB_SHA ?? "unknown").slice(0, 7);
  const actor = process.env.GITHUB_ACTOR ?? "someone";
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const runUrl =
    repo && process.env.GITHUB_RUN_ID
      ? `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null;
  const deployUrl = process.env.HOMEPAGE_DEPLOY_URL ?? "https://kx-chi.vercel.app/";

  const lines = [
    `🔄 홈페이지 코드가 main에 병합됐어요 (commit ${sha}, by ${actor}).`,
    `배포: ${deployUrl}`,
  ];
  if (runUrl) lines.push(`빌드 로그: ${runUrl}`);
  lines.push(
    "이 파일의 디자인이 최신 코드와 다를 수 있어요. 최신 화면을 다시 가져오려면 Cursor 에이전트에게 재캡처를 요청하세요."
  );
  return lines.join("\n");
}

async function main() {
  loadProjectEnv();

  const token = process.env.FIGMA_ACCESS_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;

  if (!token || !fileKey) {
    console.log(
      "[figma-notify] FIGMA_ACCESS_TOKEN 또는 FIGMA_FILE_KEY가 없어 건너뜁니다."
    );
    return;
  }

  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
    method: "POST",
    headers: {
      "X-Figma-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: buildMessage() }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `[figma-notify] Figma 댓글 등록 실패 (${res.status} ${res.statusText}): ${body}`
    );
  }

  console.log("[figma-notify] Figma 파일에 동기화 알림 댓글을 남겼습니다.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
