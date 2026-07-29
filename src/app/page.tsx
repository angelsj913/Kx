import { Suspense } from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import AdminDeniedBanner from "@/components/landing/AdminDeniedBanner";
import LandingViewportScale from "@/components/landing/LandingViewportScale";
import LandingBelowFold from "@/components/landing/LandingBelowFold";

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
          <LandingBelowFold />
        </main>
        <Footer />
      </div>
    </LandingViewportScale>
  );
}
