import type { PlanId } from "@/lib/plans";

export type GenerativeBudget = {
  webCandidates: number;
  docCandidates: number;
  allowHybrid: boolean;
  maxCitations: number;
  maxSections: number;
  allowAgentic: boolean;
  allowFileExport: boolean;
};

export function getGenerativeBudget(plan: PlanId): GenerativeBudget {
  if (plan === "free") {
    return {
      webCandidates: 3,
      docCandidates: 3,
      allowHybrid: false,
      maxCitations: 3,
      maxSections: 3,
      allowAgentic: false,
      allowFileExport: false,
    };
  }
  if (plan === "professional") {
    return {
      webCandidates: 10,
      docCandidates: 10,
      allowHybrid: true,
      maxCitations: 10,
      maxSections: 12,
      allowAgentic: true,
      allowFileExport: true,
    };
  }
  return {
    webCandidates: 6,
    docCandidates: 6,
    allowHybrid: true,
    maxCitations: 6,
    maxSections: 8,
    allowAgentic: true,
    allowFileExport: true,
  };
}
