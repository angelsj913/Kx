import type { ModelTier } from "./models";

export type QualityTier = "low" | "medium" | "high";

export interface QualityTierSettings {
  modelTier: ModelTier;
  maxOutputTokens: number;
  verifyMode: "off" | "light" | "deep";
}

const SETTINGS: Record<QualityTier, QualityTierSettings> = {
  low: { modelTier: "standard", maxOutputTokens: 1024, verifyMode: "off" },
  medium: { modelTier: "standard", maxOutputTokens: 4096, verifyMode: "light" },
  // modelTier 필드는 resolveQualityTierSettings 문서용 — 실제 라우팅은 effectiveModelTier(plan) 상한
  high: { modelTier: "top", maxOutputTokens: 8192, verifyMode: "deep" },
};

export function parseQualityTier(raw: unknown): QualityTier {
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return "medium";
}

export function resolveQualityTierSettings(tier: QualityTier = "medium"): QualityTierSettings {
  return SETTINGS[tier];
}

/** 사용자 품질 선택 + 요금제 티어를 합친다. medium 은 기존(plan) 동작을 유지한다.
 *  High 는 plan 티어를 넘지 않는다(무료→top 승격 금지). Low 는 항상 standard. */
export function effectiveModelTier(planTier: ModelTier, qualityTier: QualityTier): ModelTier {
  if (qualityTier === "low") return "standard";
  // medium / high: 요금제 상한 유지 (high 는 verify·토큰만 강화)
  return planTier;
}
