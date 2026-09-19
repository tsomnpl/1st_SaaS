export type PosterQcReport = {
  pass: boolean;
  has_person: boolean;
  person_natural: boolean;
  readable_text: boolean;
  text_matches_brief: boolean;
  domain_fit: boolean;
  looks_ai_generic: boolean;
  issues: string[];
  repair_prompt: string;
};

const EMPTY: PosterQcReport = {
  pass: true,
  has_person: true,
  person_natural: true,
  readable_text: true,
  text_matches_brief: true,
  domain_fit: true,
  looks_ai_generic: false,
  issues: [],
  repair_prompt: "",
};

export function skippedQcReport(): PosterQcReport {
  return { ...EMPTY, pass: true, issues: ["QC_SKIPPED"] };
}

export function qcPrompt(briefTitle: string, domain: string, facts: string[]) {
  return [
    "You are the FlyerMint art director doing a quality check on a finished poster.",
    "Reply with JSON only, no markdown.",
    "Keys: pass (boolean), has_person, person_natural, readable_text, text_matches_brief, domain_fit, looks_ai_generic, issues (string[]), repair_prompt (string).",
    "FAIL (pass=false) if: no visible human, plastic/waxy/AI face or bad hands, unreadable or gibberish text, invented facts, generic AI collage, wrong domain vibe.",
    "The poster MUST contain at least one real-looking person who belongs in the scene.",
    `Domain: ${domain}.`,
    `Title that must appear correctly: ${briefTitle}.`,
    facts.length ? `Facts that must not be altered: ${facts.join(" | ")}.` : "",
    "repair_prompt: one short English instruction to fix the worst issue, or empty if pass.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function parseQcReport(raw: string): PosterQcReport {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return skippedQcReport();
  try {
    const data = JSON.parse(jsonMatch[0]) as Partial<PosterQcReport>;
    const hasPerson = data.has_person !== false;
    const natural = data.person_natural !== false;
    const readable = data.readable_text !== false;
    const matches = data.text_matches_brief !== false;
    const domainFit = data.domain_fit !== false;
    const generic = Boolean(data.looks_ai_generic);
    const issues = Array.isArray(data.issues) ? data.issues.map(String).slice(0, 8) : [];
    const explicitFail = data.pass === false || !hasPerson || !natural || !readable || !matches || generic || !domainFit;
    return {
      pass: !explicitFail,
      has_person: hasPerson,
      person_natural: natural,
      readable_text: readable,
      text_matches_brief: matches,
      domain_fit: domainFit,
      looks_ai_generic: generic,
      issues,
      repair_prompt: String(data.repair_prompt ?? "").slice(0, 500),
    };
  } catch {
    return skippedQcReport();
  }
}

export function shouldRepair(report: PosterQcReport) {
  return !report.pass;
}

export function applyRepair(prompt: string, report: PosterQcReport) {
  const hint = report.repair_prompt || report.issues.join("; ") || "Fix the failed quality checks.";
  return [
    prompt,
    "QUALITY REPAIR (mandatory):",
    hint,
    "Keep every title, date, price, phone and CTA exactly as given.",
    "One photoreal human, natural skin, correct hands, no plastic AI face.",
    "No gibberish letters. No extra invented headlines.",
  ].join("\n");
}
