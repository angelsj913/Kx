"use client";

import { useLandingT, type LandingDictKey } from "@/lib/landingI18n";
import SupportShell from "@/components/support/SupportShell";

const TERMS_KEYS: [LandingDictKey, LandingDictKey][] = [
  ["support.legal.terms.s1.title", "support.legal.terms.s1.body"],
  ["support.legal.terms.s2.title", "support.legal.terms.s2.body"],
  ["support.legal.terms.s3.title", "support.legal.terms.s3.body"],
  ["support.legal.terms.s4.title", "support.legal.terms.s4.body"],
  ["support.legal.terms.s5.title", "support.legal.terms.s5.body"],
];

const PRIVACY_KEYS: [LandingDictKey, LandingDictKey][] = [
  ["support.legal.privacy.s1.title", "support.legal.privacy.s1.body"],
  ["support.legal.privacy.s2.title", "support.legal.privacy.s2.body"],
  ["support.legal.privacy.s3.title", "support.legal.privacy.s3.body"],
  ["support.legal.privacy.s4.title", "support.legal.privacy.s4.body"],
  ["support.legal.privacy.s5.title", "support.legal.privacy.s5.body"],
];

const CONSENT_KEYS: [LandingDictKey, LandingDictKey][] = [
  ["support.legal.consent.s1.title", "support.legal.consent.s1.body"],
  ["support.legal.consent.s2.title", "support.legal.consent.s2.body"],
  ["support.legal.consent.s3.title", "support.legal.consent.s3.body"],
];

function Section({ titleKey, bodyKey }: { titleKey: LandingDictKey; bodyKey: LandingDictKey }) {
  const t = useLandingT();
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t(titleKey)}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {t(bodyKey)}
      </p>
    </div>
  );
}

export default function SupportLegalPage() {
  const t = useLandingT();

  return (
    <SupportShell active="legal">
      <div className="space-y-10">
        {/* 이용약관 */}
        <section>
          <h1 id="terms" className="scroll-mt-20 text-xl font-bold sm:text-2xl">
            {t("support.legal.termsTitle")}
          </h1>
          <div className="mt-4 space-y-4">
            {TERMS_KEYS.map(([titleKey, bodyKey]) => (
              <Section key={titleKey} titleKey={titleKey} bodyKey={bodyKey} />
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
          <div className="mt-4 space-y-4">
            {PRIVACY_KEYS.map(([titleKey, bodyKey]) => (
              <Section key={titleKey} titleKey={titleKey} bodyKey={bodyKey} />
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
            {CONSENT_KEYS.map(([titleKey, bodyKey]) => (
              <Section key={titleKey} titleKey={titleKey} bodyKey={bodyKey} />
            ))}
          </div>
        </section>
      </div>
    </SupportShell>
  );
}
