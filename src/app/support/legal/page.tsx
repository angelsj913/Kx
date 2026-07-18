"use client";

import { useLandingT } from "@/lib/landingI18n";
import SupportShell from "@/components/support/SupportShell";
import { TERMS, PRIVACY, CONSENT, COMPANY_INFO, type LegalArticle } from "@/lib/legalContent";

function Article({ article }: { article: LegalArticle }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{article.title}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {article.body}
      </p>
    </div>
  );
}

export default function SupportLegalPage() {
  const t = useLandingT();

  return (
    <SupportShell active="legal">
      <div className="space-y-10">
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {t("legal.disclaimer")}
        </p>
        {/* 이용약관 */}
        <section>
          <h1 id="terms" className="scroll-mt-20 text-xl font-bold sm:text-2xl">
            {t("support.legal.termsTitle")}
          </h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t("legal.effectiveDate")} {COMPANY_INFO.effectiveDate}
          </p>
          <div className="mt-4 space-y-4">
            {TERMS.map((a) => (
              <Article key={a.id} article={a} />
            ))}
            {/* 만 19세 이상 확인 조항 (필수, 최하단) */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t("support.legal.age.title")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t("support.legal.age.body")}
              </p>
            </div>
          </div>
        </section>

        {/* 개인정보처리방침 */}
        <section className="border-t border-slate-200 pt-8 dark:border-slate-800">
          <h2 id="privacy" className="scroll-mt-20 text-xl font-bold sm:text-2xl">
            {t("support.legal.privacyTitle")}
          </h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t("legal.lastUpdated")} {COMPANY_INFO.lastUpdated}
          </p>
          <div className="mt-4 space-y-4">
            {PRIVACY.map((a) => (
              <Article key={a.id} article={a} />
            ))}
          </div>
        </section>

        {/* 개인정보 수집 이용 동의서 */}
        <section className="border-t border-slate-200 pt-8 dark:border-slate-800">
          <h2 id="consent" className="scroll-mt-20 text-xl font-bold sm:text-2xl">
            {t("support.legal.consentTitle")}
          </h2>
          <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            {t("support.legal.consent.notice")}
          </p>
          <div className="mt-4 space-y-4">
            {CONSENT.map((a) => (
              <Article key={a.id} article={a} />
            ))}
          </div>
        </section>

        {/* 사업자 정보 */}
        <section className="border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{t("legal.bizInfo.title")}</p>
            <p className="mt-2">{t("legal.bizInfo.name")} {COMPANY_INFO.companyName}</p>
            <p>{t("legal.bizInfo.rep")} {COMPANY_INFO.representative}</p>
            <p>{t("legal.bizInfo.address")} {COMPANY_INFO.address}</p>
            <p>{t("legal.bizInfo.bizNo")} {COMPANY_INFO.businessNo}</p>
            <p>{t("legal.bizInfo.mailOrderNo")} {COMPANY_INFO.mailOrderNo}</p>
            <p>{t("legal.bizInfo.privacyOfficer")} {COMPANY_INFO.privacyOfficer}</p>
            <p>{t("legal.bizInfo.contact")} {COMPANY_INFO.contactEmail}</p>
          </div>
        </section>
      </div>
    </SupportShell>
  );
}
