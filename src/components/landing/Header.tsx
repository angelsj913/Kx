"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, Building2, TrendingUp, FlaskConical, Download } from "lucide-react";
import {
  useLandingLanguage,
  useLandingT,
  LANGUAGE_LABELS,
  LANGUAGE_ORDER,
  type LandingLanguage,
} from "@/lib/landingI18n";
import SupportCenter from "./SupportCenter";
import CompanyInfoModal, { type CompanyTab } from "./CompanyInfoModal";

export default function Header() {
  const t = useLandingT();
  const { language, setLanguage } = useLandingLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [companyTab, setCompanyTab] = useState<CompanyTab | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
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

  function openCompany(tabValue: CompanyTab) {
    setMenuOpen(false);
    setCompanyTab(tabValue);
  }

  function goToDownload() {
    setMenuOpen(false);
    document.querySelector("#download")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          scrolled
            ? "border-b border-slate-200/80 bg-slate-50/80 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-900/5"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Image src="/logo-zeff.png" alt="ZEFF AI" width={28} height={28} className="rounded-md" />
            <span className="text-base font-bold tracking-tight text-slate-900">ZEFF AI</span>
          </div>

          <div className="flex items-center gap-4">
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                aria-label={t("header.language")}
                className="flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-400/60 hover:text-slate-900"
              >
                {LANGUAGE_LABELS[language]}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 6 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute right-0 top-full mt-2 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10"
                  >
                    {LANGUAGE_ORDER.map((lang: LandingLanguage) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setLanguage(lang);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center px-3.5 py-2 text-left text-sm transition-colors ${
                          lang === language ? "bg-blue-600/10 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {LANGUAGE_LABELS[lang]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {t("header.support")}
            </button>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {t("header.login")}
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden border-b border-slate-200 bg-slate-50/95 backdrop-blur-md"
            >
              <nav className="mx-auto flex max-w-6xl flex-col px-6 py-4">
                <button
                  type="button"
                  onClick={() => openCompany("about")}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600"
                >
                  <Building2 className="h-4 w-4" />
                  {t("nav.about")}
                </button>
                <button
                  type="button"
                  onClick={() => openCompany("vision")}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600"
                >
                  <TrendingUp className="h-4 w-4" />
                  {t("nav.potential")}
                </button>
                <button
                  type="button"
                  onClick={() => openCompany("prototype")}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600"
                >
                  <FlaskConical className="h-4 w-4" />
                  {t("nav.prototype")}
                </button>
                <button
                  type="button"
                  onClick={goToDownload}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600"
                >
                  <Download className="h-4 w-4" />
                  {t("nav.download")}
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SupportCenter open={supportOpen} onClose={() => setSupportOpen(false)} />
      <CompanyInfoModal
        open={companyTab !== null}
        onClose={() => setCompanyTab(null)}
        initialTab={companyTab ?? "about"}
      />
    </>
  );
}
