import { Suspense } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import AdminDeniedBanner from "@/components/landing/AdminDeniedBanner";
import LandingViewportScale from "@/components/landing/LandingViewportScale";

/** Below-the-fold sections — lazy load to shrink initial JS and speed first paint */
const WorkspaceIntro = dynamic(() => import("@/components/landing/WorkspaceIntro"));
const OfficeFeatures = dynamic(() => import("@/components/landing/OfficeFeatures"));
const LectureAnalysis = dynamic(() => import("@/components/landing/LectureAnalysis"));
const FeatureGrid = dynamic(() => import("@/components/landing/FeatureGrid"));
const WhyZeff = dynamic(() => import("@/components/landing/WhyZeff"));
const Pricing = dynamic(() => import("@/components/landing/Pricing"));
const FeatureShowcase = dynamic(() => import("@/components/landing/FeatureShowcase"));
const Team = dynamic(() => import("@/components/landing/Team"));

export default function Landing() {
  return (
    <LandingViewportScale>
      <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-noto-kr)] text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
        <Header />
        <Suspense fallback={null}>
          <AdminDeniedBanner />
        </Suspense>
        <main>
          <Hero />
          <WorkspaceIntro />
          <OfficeFeatures />
          <LectureAnalysis />
          <FeatureGrid />
          <WhyZeff />
          <Pricing />
          <FeatureShowcase />
          <Team />
        </main>
        <Footer />
      </div>
    </LandingViewportScale>
  );
}
