import { Suspense } from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import WorkspaceIntro from "@/components/landing/WorkspaceIntro";
import OfficeFeatures from "@/components/landing/OfficeFeatures";
import LectureAnalysis from "@/components/landing/LectureAnalysis";
import FeatureGrid from "@/components/landing/FeatureGrid";
import WhyZeff from "@/components/landing/WhyZeff";
import Pricing from "@/components/landing/Pricing";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import Team from "@/components/landing/Team";
import Footer from "@/components/landing/Footer";
import AdminDeniedBanner from "@/components/landing/AdminDeniedBanner";
import LandingViewportScale from "@/components/landing/LandingViewportScale";

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
