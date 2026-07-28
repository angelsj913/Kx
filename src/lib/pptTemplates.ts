/**
 * 도메인 PPT 템플릿 — `src/data/ppt-templates/*.json` 을 builtin 팔레트에 합친다.
 * (plan 011 future → plan 018)
 */
import legal from "@/data/ppt-templates/legal.json";
import startup from "@/data/ppt-templates/startup.json";
import healthcare from "@/data/ppt-templates/healthcare.json";

export interface PptDomainPalette {
  primary: string;
  secondary: string;
  accent: string;
  primarySoft: string;
  text: string;
  muted: string;
  white: string;
  surface: string;
  surfaceAlt: string;
}

export interface PptDomainTemplate {
  id: string;
  label: string;
  keywords: string[];
  palette: PptDomainPalette;
}

const DOMAIN_TEMPLATES: PptDomainTemplate[] = [
  legal as PptDomainTemplate,
  startup as PptDomainTemplate,
  healthcare as PptDomainTemplate,
];

export function listPptDomainTemplates(): PptDomainTemplate[] {
  return DOMAIN_TEMPLATES;
}

/** 제목·부제에서 도메인 템플릿 id 추정 */
export function inferDomainTemplateId(title: string, subtitle?: string): string | null {
  const t = `${title} ${subtitle ?? ""}`.toLowerCase();
  for (const tmpl of DOMAIN_TEMPLATES) {
    if (tmpl.keywords.some((kw) => t.includes(kw.toLowerCase()))) {
      return tmpl.id;
    }
  }
  return null;
}

export function domainPaletteById(
  id: string,
): (PptDomainPalette & { name: string }) | null {
  const tmpl = DOMAIN_TEMPLATES.find((x) => x.id === id);
  if (!tmpl) return null;
  return { name: tmpl.id, ...tmpl.palette };
}
