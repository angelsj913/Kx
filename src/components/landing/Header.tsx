"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Building2,
  TrendingUp,
  FlaskConical,
  Download,
  Wrench,
  LifeBuoy,
} from "lucide-react";
import {
  useLandingLanguage,
  useLandingT,
  LANGUAGE_LABELS,
  LANGUAGE_ORDER,
  type LandingLanguage,
} from "@/lib/landingI18n";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/ui/Logo";

const MENU_LINKS = [
  { href: "/about", icon: Building2, labelKey: "nav.about" as const },
  { href: "/vision", icon: TrendingUp, labelKey: "nav.potential" as const },
  { href: "/prototype", icon: FlaskConical, labelKey: "nav.prototype" as const },
  { href: "/download", icon: Download, labelKey: "nav.download" as const },
  { href: "/support", icon: LifeBuoy, labelKey: "nav.support" as const },
];

export default function Header() {
  const t = useLandingT();
  const { language, setLanguage } = useLandingLanguage();
  
  // useSession 안전하게 사용 (prerender 에러 방지)
  const sessionResult = useSession?.();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "unauthenticated";
  const isLoggedIn = status === "authenticated";
  // 세션의 isAdmin (Google/이메일 공통) + 이메일 fallback
  const sessionEmail = (session?.user?.email ?? "").toLowerCase();
  const isAdmin =
    isLoggedIn &&
    (!!session?.user?.isAdmin ||
      sessionEmail === "zeff@zeffai.com" ||
      sessionEmail === "kxeung9@gmail.com");

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    function onClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [langOpen]);

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        scrolled ? "border-b border-slate-200/80 bg-slate-50/80 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80" : "border-b border-transparent bg-transparent"
      }`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/5">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center" aria-label="ZEFF AI 홈">
              <Logo size="lg" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              // 일반 <a> 로 전체 페이지 이동 — soft navigation 후 silent redirect 가
              // 홈에서 '버튼 무반응'처럼 보이던 문제 방지
              <a
                href="/admin"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-blue-500/50 bg-blue-600/10 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white dark:border-blue-400/50 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                title={t("header.adminPanel")}
              >
                <Wrench className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{t("header.admin")}</span>
              </a>
            )}

            <ThemeToggle />

            {/* 언어 선택 */}
            <div ref={langRef} className="relative">
              <button type="button" onClick={() => setLangOpen((v) => !v)} className="flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-400/60 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:text-white">
                {LANGUAGE_LABELS[language]}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.96, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 6 }} className="absolute right-0 top-full mt-2 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                    {LANGUAGE_ORDER.map((lang: LandingLanguage) => (
                      <button key={lang} type="button" onClick={() => { setLanguage(lang); setLangOpen(false); }} className={`flex w-full items-center px-3.5 py-2 text-left text-sm transition-colors ${lang === language ? "bg-blue-600/10 font-semibold text-blue-700 dark:text-blue-300" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                        {LANGUAGE_LABELS[lang]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 로그인 상태에 따른 버튼 (안전하게 처리) */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="hidden max-w-[8rem] truncate text-xs font-medium text-slate-600 sm:inline dark:text-slate-300">
                  {session?.user?.name || session?.user?.email || t("header.profile")}
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline dark:text-slate-300 dark:hover:text-white"
                >
                  {t("header.logout")}
                </button>
                <Link
                  href="/app"
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all active:scale-[0.985] sm:px-5"
                >
                  {t("header.startWeb")}
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {t("header.login")}
              </Link>
            )}
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-slate-200 bg-slate-50/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
              <nav className="mx-auto flex max-w-6xl flex-col px-6 py-4">
                {MENU_LINKS.map(({ href, icon: Icon, labelKey }) => (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-blue-300">
                    <Icon className="h-4 w-4" />
                    {t(labelKey)}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
