import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import TechDemo from "@/components/landing/TechDemo";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-noto-kr)] text-slate-900">
      <Header />
      <main>
        <Hero />
        <TechDemo />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
