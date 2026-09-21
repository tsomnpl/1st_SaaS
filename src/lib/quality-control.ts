export type PosterQcReport = {
  pass: boolean;
  has_person: boolean;
  person_natural: boolean;
  readable_text: boolean;
  text_matches_brief: boolean;
  domain_fit: boolean;
  looks_ai_generic: boolean;
  format_ok: boolean;
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
  format_ok: true,
  issues: [],
  repair_prompt: "",
};

export const MAX_QC_ATTEMPTS = 3;

export function skippedQcReport(): PosterQcReport {
  return {
    ...EMPTY,
    pass: false,
    has_person: false,
    person_natural: false,
    readable_text: false,
    text_matches_brief: false,
    format_ok: false,
    issues: ["QC_SKIPPED"],
    repair_prompt:
      "Verify one photoreal human belonging in the scene, readable exact brief text, correct format, no invented facts.",
  };
}

export function qcWasSkipped(report: PosterQcReport) {
  return report.issues.includes("QC_SKIPPED");
}

export function qcPrompt(briefTitle: string, domain: string, facts: string[], format?: string) {
  return [
    "You are the FlyerMint art director doing a quality check on a finished poster.",
    "Reply with JSON only, no markdown.",
    "Keys: pass (boolean), has_person, person_natural, readable_text, text_matches_brief, domain_fit, looks_ai_generic, format_ok, issues (string[]), repair_prompt (string).",
    "FAIL (pass=false) if: no visible human, plastic/waxy/AI face or bad hands, unreadable or gibberish text, invented facts, generic AI collage, wrong domain vibe, cropped edges, wrong orientation.",
    "The poster MUST contain at least one real-looking person who belongs in the scene.",
    `Domain: ${domain}.`,
    format ? `Requested format/orientation: ${format}.` : "",
    `Title that must appear correctly: ${briefTitle}.`,
    facts.length ? `Facts that must not be altered or invented: ${facts.join(" | ")}.` : "",
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
    const formatOk = data.format_ok !== false;
    const generic = Boolean(data.looks_ai_generic);
    const issues = Array.isArray(data.issues) ? data.issues.map(String).slice(0, 8) : [];
    const explicitFail =
      data.pass === false ||
      !hasPerson ||
      !natural ||
      !readable ||
      !matches ||
      generic ||
      !domainFit ||
      !formatOk;
    return {
      pass: !explicitFail,
      has_person: hasPerson,
      person_natural: natural,
      readable_text: readable,
      text_matches_brief: matches,
      domain_fit: domainFit,
      looks_ai_generic: generic,
      format_ok: formatOk,
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

export function isCriticalQcFailure(report: PosterQcReport) {
  if (qcWasSkipped(report)) return false;
  return !report.has_person || !report.person_natural || !report.readable_text || !report.text_matches_brief;
}

export function applyRepair(prompt: string, report: PosterQcReport) {
  const extras: string[] = [];
  if (!report.has_person) {
    extras.push(
      "PROBLEM: missing human. Add one photoreal person who belongs in this business scene, correctly proportioned and lit with the environment.",
    );
  } else if (!report.person_natural) {
    extras.push(
      "PROBLEM: artificial face. Natural skin pores, real eyes, correct teeth, unwarped hands and fingers, no plastic AI look. Simplify hand-object interaction if needed.",
    );
  }
  if (!report.readable_text || !report.text_matches_brief) {
    extras.push(
      "PROBLEM: unreadable or invented text. Rebuild hierarchy: title first, then offer, then facts. Keep every user-provided fact exact. No extra headlines.",
    );
  }
  if (report.looks_ai_generic) {
    extras.push(
      "PROBLEM: generic AI poster. Recover stronger domain composition from the visual library principles: clearer hero, better crop, original lighting.",
    );
  }
  if (!report.format_ok) {
    extras.push("PROBLEM: wrong crop or format. Respect the requested orientation, safe margins, nothing cut off.");
  }
  const hint = report.repair_prompt || report.issues.filter((issue) => issue !== "QC_SKIPPED").join("; ");
  return [
    prompt,
    "QUALITY REPAIR (mandatory):",
    hint || "Fix the failed quality checks.",
    ...extras,
    "Keep every title, date, price, phone and CTA exactly as given.",
    "One photoreal human, natural skin, correct hands, no plastic AI face.",
    "No gibberish letters. No extra invented headlines.",
  ].join("\n");
}
