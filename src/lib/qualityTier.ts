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
  high: { modelTier: "top", maxOutputTokens: 8192, verifyMode: "deep" },
};

export function parseQualityTier(raw: unknown): QualityTier {
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return "medium";
}

export function resolveQualityTierSettings(tier: QualityTier = "medium"): QualityTierSettings {
  return SETTINGS[tier];
}

const TIER_RANK: Record<ModelTier, number> = {
  standard: 0,
  priority: 1,
  top: 2,
};

/** 사용자 품질 선택 + 요금제 티어를 합친다. medium 은 기존(plan) 동작을 유지한다. */
export function effectiveModelTier(planTier: ModelTier, qualityTier: QualityTier): ModelTier {
  if (qualityTier === "low") return "standard";
  if (qualityTier === "medium") return planTier;
  const target = SETTINGS.high.modelTier;
  return TIER_RANK[planTier] >= TIER_RANK[target] ? planTier : target;
}
