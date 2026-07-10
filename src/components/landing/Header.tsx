"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLandingLanguage, useLandingT, type LandingDictKey } from "@/lib/landingI18n";
import ContactModal from "./ContactModal";

const NAV_ITEMS: { key: LandingDictKey; anchor: string }[] = [
  { key: "nav.about", anchor: "#about" },
  { key: "nav.potential", anchor: "#potential" },
  { key: "nav.prototype", anchor: "#prototype" },
  { key: "nav.download", anchor: "#download" },
];

export default function Header() {
  const t = useLandingT();
  const { language, setLanguage } = useLandingLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(anchor: string) {
    setMenuOpen(false);
    document.querySelector(anchor)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
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
            <Image src="/logo-zeff.jpg" alt="zeff AI" width={28} height={28} className="rounded-md" />
            <span className="text-base font-bold tracking-tight text-slate-900">zeff AI</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center overflow-hidden rounded-full border border-slate-300 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLanguage("ko")}
                className={`px-2.5 py-1 transition-colors ${
                  language === "ko" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                KR
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 transition-colors ${
                  language === "en" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
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
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden border-b border-slate-200 bg-slate-50/95 backdrop-blur-md"
            >
              <nav className="mx-auto flex max-w-6xl flex-col px-6 py-4">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => goTo(item.anchor)}
                    className="rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600"
                  >
                    {t(item.key)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setContactOpen(true);
                  }}
                  className="rounded-lg px-2 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-blue-600"
                >
                  {t("nav.support")}
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </>
  );
}
