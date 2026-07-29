"use client";

import dynamic from "next/dynamic";

const SkillsSection = dynamic(() => import("@/components/landing/SkillsSection"), {
  ssr: false,
});
const FeatureShowcase = dynamic(() => import("@/components/landing/FeatureShowcase"), {
  ssr: false,
});
const WorkLectureScroll = dynamic(() => import("@/components/landing/WorkLectureScroll"), {
  ssr: false,
});
const WorkspaceIntro = dynamic(() => import("@/components/landing/WorkspaceIntro"), {
  ssr: false,
});
const PricingLead = dynamic(() => import("@/components/landing/PricingLead"), {
  ssr: false,
});
const Pricing = dynamic(() => import("@/components/landing/Pricing"), {
  ssr: false,
});

/** Below-fold landing sections — client-only to skip SSR cost / heavy sticky JS. */
export default function LandingBelowFold() {
  return (
    <>
      <SkillsSection />
      <FeatureShowcase />
      <WorkLectureScroll />
      <WorkspaceIntro />
      <PricingLead />
      <Pricing />
    </>
  );
}
