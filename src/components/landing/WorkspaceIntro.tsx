"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLandingT } from "@/lib/landingI18n";

export default function WorkspaceIntro() {
  const t = useLandingT();
  const { status } = useSession();
  const appHref = status === "authenticated" ? "/app" : "/login?callbackUrl=%2Fapp";

  return (
    <section className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mx-auto max-w-2xl break-keep text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
          {t("workspace.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
          {t("workspace.subtitle")}
        </p>
        <Link
          href={appHref}
          className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t("header.startWeb")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
