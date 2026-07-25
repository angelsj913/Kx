/** ZEFF AI 파이프라인 단계별 진단 로그 — 서버 콘솔에서 원인 추적용 */

export type PipelineStage =
  | "vision/candidates"
  | "vision/generate"
  | "image-gen/candidates"
  | "image-gen/generate"
  | "image-gen/upscale"
  | "image-gen/blob-upload";

export function pipelineInfo(stage: PipelineStage, message: string, detail?: string): void {
  console.info(`[zeff-pipeline] ${stage} · ${message}${detail ? ` · ${detail}` : ""}`);
}

export function pipelineWarn(
  stage: PipelineStage,
  message: string,
  err?: unknown,
): void {
  const errMsg =
    err instanceof Error ? err.message : err != null ? String(err) : undefined;
  console.warn(
    `[zeff-pipeline] ${stage} · ${message}${errMsg ? ` · ${errMsg.slice(0, 300)}` : ""}`,
  );
}

export function pipelineError(stage: PipelineStage, message: string, err?: unknown): void {
  const errMsg =
    err instanceof Error ? err.message : err != null ? String(err) : undefined;
  console.error(
    `[zeff-pipeline] ${stage} · FAIL · ${message}${errMsg ? ` · ${errMsg.slice(0, 500)}` : ""}`,
  );
}

export class PipelineStageError extends Error {
  readonly stage: PipelineStage;

  constructor(stage: PipelineStage, message: string, cause?: unknown) {
    const causeMsg =
      cause instanceof Error ? cause.message : cause != null ? String(cause) : "";
    super(causeMsg ? `[${stage}] ${message}: ${causeMsg}` : `[${stage}] ${message}`);
    this.name = "PipelineStageError";
    this.stage = stage;
  }
}
