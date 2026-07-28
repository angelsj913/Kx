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
  Languages,
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

const SHOW_DOWNLOAD_CTA = process.env.NEXT_PUBLIC_SHOW_DOWNLOAD_CTA === "1";

const SECTION_LINKS = [
  { href: "/#skills", labelKey: "nav.skills" as const },
  { href: "/#features", labelKey: "nav.features" as const },
  { href: "/#pricing", labelKey: "nav.pricing" as const },
] as const;

const MENU_LINKS = [
  { href: "/about", icon: Building2, labelKey: "nav.about" as const },
  { href: "/vision", icon: TrendingUp, labelKey: "nav.potential" as const },
  { href: "/prototype", icon: FlaskConical, labelKey: "nav.prototype" as const },
  ...(SHOW_DOWNLOAD_CTA
    ? [{ href: "/download", icon: Download, labelKey: "nav.download" as const }]
    : []),
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
  const isAdmin = isLoggedIn && session?.user?.isAdmin === true;

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 8px는 너무 빨라 살짝만 움직여도 배경이 튀었다. 헤더 높이 근처에서 바꾼다.
    function onScroll() { setScrolled(window.scrollY > 48); }
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

  const menuSurface =
    "border-slate-900/[0.06] bg-white/85 backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.08] dark:bg-slate-950/85";
  const scrolledSurface =
    "border-slate-900/[0.06] bg-white/70 shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.15)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.08] dark:bg-slate-950/70";

  return (
    <>
      <header
        // 최상단에서는 배경을 아예 칠하지 않는다 — 배경이 없으면 헤더/본문 경계선이
        // 생길 수가 없다. 색을 맞추려던 과거 3번의 시도가 전부 재발한 이유가 이것이다.
        // 스크롤 후에는 프로스트 글래스로 전환해, 뒤 배경이 무엇이든 블러가 흡수한다.
        // 햄버거가 열리면 드로어와 동일한 표면 토큰을 써서 이음새 색 차이를 없앤다.
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          menuOpen ? menuSurface : scrolled ? scrolledSurface : "border-transparent bg-transparent"
        }`}
      >
        {/* 모바일에서 내용물 폭이 화면을 넘겨 로그인 버튼이 밖으로 밀려나 있었다.
            여백을 줄이고, 오른쪽은 축소 대상에서 빼고, 왼쪽은 넘칠 때 겹치는 대신
            잘리도록 min-w-0 을 준다 — 언어가 바뀌어 라벨이 길어져도 재발하지 않는다. */}
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label={t("header.menuAria")} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/5">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {/* overflow-hidden: 극단적으로 좁은 화면에서 워드마크가 옆 버튼을 밀지 않고 잘리게 한다 */}
            <Link href="/" className="flex min-w-0 items-center overflow-hidden" aria-label={t("header.homeAria")}>
              <Logo size="lg" />
            </Link>

            <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label={t("header.sectionNavAria")}>
              {SECTION_LINKS.map(({ href, labelKey }) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {t(labelKey)}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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

            {/* 언어 선택 — 모바일에서는 폭을 차지해 로그인을 밀어내므로 햄버거 메뉴로 옮겼다 */}
            <div ref={langRef} className="relative hidden sm:block">
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
                  className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.985] sm:px-5"
                >
                  {t("header.startWeb")}
                </Link>
              </div>
            ) : (
              // min-h/px 는 rem 이 아니라 px 이라 모바일 rem 축소(globals.css)의 영향을 받지 않는다.
              // 글자만 작아지고 탭 영역은 44px 를 유지한다.
              <Link
                href="/login?callbackUrl=%2Fapp"
                className="inline-flex min-h-[44px] items-center px-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {t("header.login")}
              </Link>
            )}
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={`overflow-hidden border-b ${menuSurface}`}>
              <nav className="mx-auto flex max-w-6xl flex-col px-4 py-4 sm:px-6">
                {SECTION_LINKS.map(({ href, labelKey }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-blue-300"
                  >
                    {t(labelKey)}
                  </a>
                ))}

                {MENU_LINKS.map(({ href, icon: Icon, labelKey }) => (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-blue-300">
                    <Icon className="h-4 w-4" />
                    {t(labelKey)}
                  </Link>
                ))}

                {isAdmin && (
                  <a
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-3 text-left text-sm font-medium text-blue-700 transition-colors hover:bg-blue-600/10 dark:text-blue-300 dark:hover:bg-blue-600/10"
                  >
                    <Wrench className="h-4 w-4" />
                    {t("header.adminPanel")}
                  </a>
                )}

                {/* 언어 — 헤더에서 밀려난 모바일 전용. 데스크톱은 헤더 드롭다운이 그대로 있다 */}
                <div className="mt-2 border-t border-slate-900/[0.06] pt-3 sm:hidden dark:border-white/[0.08]">
                  <p className="flex items-center gap-2.5 px-2 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Languages className="h-4 w-4" />
                    {t("header.language")}
                  </p>
                  <div className="flex flex-wrap gap-1.5 px-2 pt-1.5">
                    {LANGUAGE_ORDER.map((lang: LandingLanguage) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => { setLanguage(lang); setMenuOpen(false); }}
                        className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                          lang === language
                            ? "bg-blue-600/10 font-semibold text-blue-700 dark:text-blue-300"
                            : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5"
                        }`}
                      >
                        {LANGUAGE_LABELS[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
