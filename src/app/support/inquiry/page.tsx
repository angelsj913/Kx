"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Paperclip, CheckCircle2, X } from "lucide-react";
import { useLandingT } from "@/lib/landingI18n";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";

const TYPE_OPTIONS: { value: string; labelKey: Parameters<ReturnType<typeof useLandingT>>[0] }[] = [
  { value: "billing", labelKey: "support.inquiry.type.billing" },
  { value: "bug", labelKey: "support.inquiry.type.bug" },
  { value: "account", labelKey: "support.inquiry.type.account" },
  { value: "feature", labelKey: "support.inquiry.type.feature" },
  { value: "etc", labelKey: "support.inquiry.type.etc" },
];

export default function InquiryPage() {
  const t = useLandingT();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      if (file) form.set("file", file);
      const res = await fetch("/api/support/inquiry", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "접수에 실패했습니다.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3.5">
          <BackButton fallbackHref="/support" />
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-zeff.png" alt="ZEFF AI" width={24} height={24} className="rounded-md dark:invert" />
            <span className="text-sm font-bold tracking-tight">ZEFF AI</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-xl font-bold sm:text-2xl">{t("support.tab.inquiry")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("support.inquiry.intro")}</p>

        {sent ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-8 text-center dark:border-blue-500/30 dark:bg-blue-500/10">
            <CheckCircle2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{t("support.inquiry.success")}</p>
            <Link
              href="/support/inquiry/history"
              className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              {t("support.inquiry.viewHistory")}
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("support.inquiry.typeLabel")}
              </span>
              <select
                name="type"
                defaultValue="billing"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("support.inquiry.subjectLabel")}
              </span>
              <input
                type="text"
                name="subject"
                required
                placeholder={t("support.inquiry.subjectPlaceholder")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("support.inquiry.bodyLabel")}
              </span>
              <textarea
                name="body"
                required
                rows={6}
                placeholder={t("support.inquiry.bodyPlaceholder")}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("support.inquiry.fileLabel")}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <span className="truncate text-slate-700 dark:text-slate-200">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="ml-2 shrink-0 text-slate-400 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 text-sm text-slate-500 transition-colors hover:border-blue-400/60 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/60 dark:hover:text-blue-300"
                >
                  <Paperclip className="h-4 w-4" />
                  {t("support.inquiry.fileHint")}
                </button>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("support.inquiry.emailLabel")}
              </span>
              <input
                type="email"
                name="email"
                required
                placeholder={t("support.inquiry.emailPlaceholder")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-blue-500/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? t("support.inquiry.sending") : t("support.inquiry.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
