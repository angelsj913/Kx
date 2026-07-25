import { Suspense } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import AdminDeniedBanner from "@/components/landing/AdminDeniedBanner";
import LandingViewportScale from "@/components/landing/LandingViewportScale";

const WorkspaceIntro = dynamic(() => import("@/components/landing/WorkspaceIntro"));
const WorkLectureScroll = dynamic(() => import("@/components/landing/WorkLectureScroll"));
const FeatureGrid = dynamic(() => import("@/components/landing/FeatureGrid"));
const WhyZeff = dynamic(() => import("@/components/landing/WhyZeff"));
const FeatureShowcase = dynamic(() => import("@/components/landing/FeatureShowcase"));
const PricingLead = dynamic(() => import("@/components/landing/PricingLead"));
const Pricing = dynamic(() => import("@/components/landing/Pricing"));

export default function Landing() {
  return (
    <LandingViewportScale>
      <div className="landing-shell min-h-screen font-[family-name:var(--font-noto-kr)] text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:text-slate-100">
        <Header />
        <Suspense fallback={null}>
          <AdminDeniedBanner />
        </Suspense>
        <main>
          <Hero />
          <WorkspaceIntro />
          <WorkLectureScroll />
          <FeatureGrid />
          <WhyZeff />
          <FeatureShowcase />
          <PricingLead />
          <Pricing />
        </main>
        <Footer />
      </div>
    </LandingViewportScale>
  );
}
