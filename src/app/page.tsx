import { Suspense } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import AdminDeniedBanner from "@/components/landing/AdminDeniedBanner";
import LandingViewportScale from "@/components/landing/LandingViewportScale";

const SkillsSection = dynamic(() => import("@/components/landing/SkillsSection"));
const FeatureShowcase = dynamic(() => import("@/components/landing/FeatureShowcase"));
const WorkLectureScroll = dynamic(() => import("@/components/landing/WorkLectureScroll"));
const WorkspaceIntro = dynamic(() => import("@/components/landing/WorkspaceIntro"));
const PricingLead = dynamic(() => import("@/components/landing/PricingLead"));
const Pricing = dynamic(() => import("@/components/landing/Pricing"));

export default function Landing() {
  return (
    <LandingViewportScale>
      <div className="landing-shell min-h-screen text-[color:var(--landing-text-primary)] transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
        <Header />
        <Suspense fallback={null}>
          <AdminDeniedBanner />
        </Suspense>
        <main>
          <Hero />
          <SkillsSection />
          <FeatureShowcase />
          <WorkLectureScroll />
          <WorkspaceIntro />
          <PricingLead />
          <Pricing />
        </main>
        <Footer />
      </div>
    </LandingViewportScale>
  );
}
