import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/lib/landingI18n");

const prefixes = {
  ko: "일하는 AI,",
  en: "speed of thought —",
  ja: "働くAI、",
  zh: "工作的 AI，",
  ru: "со скоростью мысли —",
  de: "des Denkens —",
  fr: "à la vitesse de la pensée —",
  es: "a la velocidad del pensamiento —",
};

const pricingPatches = {
  ko: {
    "pricing.free.name": "free",
    "pricing.free.bullet2": "월 5회 문서 생성",
    "pricing.free.bullet3": "PPT · 엑셀 체험 (주 1회)",
    "pricing.free.bullet6": "서재 저장 5개",
    "pricing.pro.badge": "무료 대비 약 30배 이용량",
    "pricing.pro.bullet1": "실무에 맞춘 확장 작업 환경",
    "pricing.pro.bullet2": "무료 대비 약 30배 이용량",
    "pricing.pro.bullet3": "우선 처리 큐 배정",
    "pricing.pro.bullet4": "고급 문서·분석 도구 이용",
    "pricing.pro.bullet5": "PPT · 엑셀 · 문서 생성",
    "pricing.pro.bullet6": "내 서재 저장 공간 확장",
    "pricing.pro.bullet7": "이메일 우선 지원",
    "pricing.professional.badge1": "무료 대비 약 100배 이용량",
    "pricing.professional.badge2": "정밀 AI 라우트 이용",
    "pricing.professional.bullet1": "Pro 기능 + 확장 한도",
    "pricing.professional.bullet2": "무료 대비 약 100배 이용량",
    "pricing.professional.bullet3": "다중 AI 라우트·정밀 검수 우선 적용",
    "pricing.professional.bullet4": "시험지 분석 · 유사문제 생성 확대 한도",
    "pricing.professional.bullet5": "전담 지원 채널 제공",
    "pricing.professional.bullet6": "신규 기능 우선 체험",
    "pricing.professional.bullet7": "팀 계정 연동 (준비 중)",
  },
  en: {
    "pricing.free.name": "free",
    "pricing.free.bullet2": "5 document generations / month",
    "pricing.free.bullet3": "PPT · Excel trial (1 / week)",
    "pricing.free.bullet6": "Library storage for 5 files",
    "pricing.pro.badge": "About 30× free usage allowance",
    "pricing.pro.bullet1": "Expanded workspace for real work",
    "pricing.pro.bullet2": "About 30× free usage allowance",
    "pricing.pro.bullet3": "Priority processing queue",
    "pricing.pro.bullet4": "Broader document & analysis tools",
    "pricing.pro.bullet5": "PPT · Excel · document generation",
    "pricing.pro.bullet6": "Expanded library storage",
    "pricing.pro.bullet7": "Priority email support",
    "pricing.professional.badge1": "About 100× free usage allowance",
    "pricing.professional.badge2": "Precision AI routing",
    "pricing.professional.bullet1": "Pro features + higher limits",
    "pricing.professional.bullet2": "About 100× free usage allowance",
    "pricing.professional.bullet3": "Multi-AI routing with priority refinement",
    "pricing.professional.bullet4": "Higher limits for exam analysis & similar problems",
    "pricing.professional.bullet5": "Dedicated support channel",
    "pricing.professional.bullet6": "Early access to new features",
    "pricing.professional.bullet7": "Team accounts (coming soon)",
  },
};

function setKey2(content, key, value) {
  const re = new RegExp(`("${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*")([^"]*)(")`);
  if (!re.test(content)) {
    console.warn("missing", key);
    return content;
  }
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return content.replace(re, `$1${escaped}$3`);
}

for (const lang of Object.keys(prefixes)) {
  const file = path.join(dir, `${lang}.ts`);
  let c = fs.readFileSync(file, "utf8");

  // Fix broken hero block
  c = c.replace(
    /"hero\.title\.line1":\s*"[^"]*",\s*\n\s*"hero\.title\.line2":\s*"[^"]*"\s*\n\s*"hero\.title\.line2Prefix":\s*"PLACEHOLDER",,?\s*/m,
    `"hero.title.line1": ${JSON.stringify(
      lang === "ko"
        ? "생각의 속도로"
        : lang === "en"
          ? "AI that works at the"
          : lang === "ja"
            ? "思考の速さで"
            : lang === "zh"
              ? "以思考的速度"
              : lang === "ru"
                ? "ИИ, который работает"
                : lang === "de"
                  ? "KI, die im Tempo"
                  : lang === "fr"
                    ? "Une IA qui travaille"
                    : "Una IA que trabaja",
    )},\n  "hero.title.line2": "",\n  "hero.title.line2Prefix": ${JSON.stringify(prefixes[lang])},\n  `,
  );

  // Also handle if line2 still has value without broken pattern
  c = c.replace(
    /"hero\.title\.line2Prefix":\s*"PLACEHOLDER",,?/g,
    `"hero.title.line2Prefix": ${JSON.stringify(prefixes[lang])},`,
  );

  // Fix missing comma after line2 if still broken
  c = c.replace(
    /("hero\.title\.line2":\s*"[^"]*")\s*\n(\s*"hero\.title\.line2Prefix")/g,
    "$1,\n$2",
  );

  const patch = pricingPatches[lang] || pricingPatches.en;
  for (const [k, v] of Object.entries(patch)) {
    c = setKey2(c, k, v);
  }

  // Non-en/ko: still apply free name free + 100x + remove unlimited-ish with en patch keys
  if (!pricingPatches[lang]) {
    c = setKey2(c, "pricing.free.name", "free");
    // replace 150 with 100 in badges
    c = c.replace(/150/g, (m) => {
      // only in professional quota strings - crude
      return m;
    });
    c = setKey2(c, "pricing.professional.badge1", pricingPatches.en["pricing.professional.badge1"]);
    c = setKey2(c, "pricing.professional.bullet2", pricingPatches.en["pricing.professional.bullet2"]);
    c = setKey2(c, "pricing.professional.bullet3", pricingPatches.en["pricing.professional.bullet3"]);
    c = setKey2(c, "pricing.professional.bullet4", pricingPatches.en["pricing.professional.bullet4"]);
    c = setKey2(c, "pricing.pro.bullet1", pricingPatches.en["pricing.pro.bullet1"]);
    c = setKey2(c, "pricing.pro.bullet2", pricingPatches.en["pricing.pro.bullet2"]);
    c = setKey2(c, "pricing.pro.bullet4", pricingPatches.en["pricing.pro.bullet4"]);
    c = setKey2(c, "pricing.pro.bullet5", pricingPatches.en["pricing.pro.bullet5"]);
    c = setKey2(c, "pricing.pro.badge", pricingPatches.en["pricing.pro.badge"]);
    c = setKey2(c, "pricing.free.bullet2", pricingPatches.en["pricing.free.bullet2"]);
    c = setKey2(c, "pricing.free.bullet3", pricingPatches.en["pricing.free.bullet3"]);
    c = setKey2(c, "pricing.free.bullet6", pricingPatches.en["pricing.free.bullet6"]);
  }

  fs.writeFileSync(file, c);
  console.log("ok", lang);
}
