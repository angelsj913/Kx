import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import WorkspaceIntro from "@/components/landing/WorkspaceIntro";
import OfficeFeatures from "@/components/landing/OfficeFeatures";
import LectureAnalysis from "@/components/landing/LectureAnalysis";
import FeatureGrid from "@/components/landing/FeatureGrid";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-noto-kr)] text-slate-900">
      <Header />
      <main>
        <Hero />
        <WorkspaceIntro />
        <OfficeFeatures />
        <LectureAnalysis />
        <FeatureGrid />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
