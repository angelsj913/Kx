import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import LandingViewportScale from "@/components/landing/LandingViewportScale";
import Logo from "@/components/ui/Logo";

/** Marketing placeholder for content automation (/design) — Higgsfield integration not in this wave. */
export default function DesignPage() {
  return (
    <LandingViewportScale>
      <div className="landing-shell min-h-screen text-[color:var(--landing-text-primary)]">
        <Header />
        <main className="mx-auto flex max-w-2xl flex-col items-center px-6 pb-24 pt-32 text-center">
          <Logo size="lg" />
          <p className="landing-label mt-8 text-xs text-[color:var(--landing-text-muted)]">
            /design
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            콘텐츠 자동화
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[color:var(--landing-text-muted)]">
            인스타그램 캐러셀 기획·카피·이미지 생성 워크플로우를 준비하고 있습니다.
            Higgsfield 연동은 곧 공개됩니다.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login?callbackUrl=%2Fapp"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--landing-accent)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              웹에서 시작하기
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-full border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200"
            >
              홈으로
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </LandingViewportScale>
  );
}
