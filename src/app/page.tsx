import { Suspense } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import AdminDeniedBanner from "@/components/landing/AdminDeniedBanner";
import LandingViewportScale from "@/components/landing/LandingViewportScale";

/** Below-the-fold — lazy load to keep first paint light */
const ScrollStory = dynamic(() => import("@/components/landing/ScrollStory"));
const Proof = dynamic(() => import("@/components/landing/Proof"));
const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks"));
const UseCases = dynamic(() => import("@/components/landing/UseCases"));
const WhyZeff = dynamic(() => import("@/components/landing/WhyZeff"));
const Pricing = dynamic(() => import("@/components/landing/Pricing"));

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
          <ScrollStory />
          <Proof />
          <HowItWorks />
          <UseCases />
          <WhyZeff />
          <Pricing />
        </main>
        <Footer />
      </div>
    </LandingViewportScale>
  );
}
