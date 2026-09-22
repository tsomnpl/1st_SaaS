export type PosterQcReport = {
  pass: boolean;
  has_person: boolean;
  person_natural: boolean;
  readable_text: boolean;
  text_matches_brief: boolean;
  domain_fit: boolean;
  looks_ai_generic: boolean;
  format_ok: boolean;
  composition_match: boolean;
  margins_ok: boolean;
  reference_match: boolean;
  design_rules: boolean;
  human_realism: boolean;
  text_readability: boolean;
  hierarchy: boolean;
  contrast: boolean;
  alignment: boolean;
  spacing: boolean;
  safe_zone: boolean;
  image_quality: boolean;
  domain_relevance: boolean;
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
  composition_match: true,
  margins_ok: true,
  reference_match: true,
  design_rules: true,
  human_realism: true,
  text_readability: true,
  hierarchy: true,
  contrast: true,
  alignment: true,
  spacing: true,
  safe_zone: true,
  image_quality: true,
  domain_relevance: true,
  issues: [],
  repair_prompt: "",
};

export const MAX_QC_ATTEMPTS = 3;

function flag(value: unknown, fallback = true) {
  if (value === false) return false;
  if (value === true) return true;
  return fallback;
}

export function skippedQcReport(): PosterQcReport {
  return {
    ...EMPTY,
    pass: false,
    has_person: false,
    person_natural: false,
    readable_text: false,
    text_matches_brief: false,
    format_ok: false,
    composition_match: false,
    margins_ok: false,
    reference_match: false,
    design_rules: false,
    human_realism: false,
    text_readability: false,
    hierarchy: false,
    contrast: false,
    alignment: false,
    spacing: false,
    safe_zone: false,
    image_quality: false,
    domain_relevance: false,
    issues: ["QC_SKIPPED"],
    repair_prompt:
      "Verify one photoreal human belonging in the scene, readable exact brief text, correct format, structure matching the reference, no invented facts.",
  };
}

export function qcWasSkipped(report: PosterQcReport) {
  return report.issues.includes("QC_SKIPPED");
}

export function qcPrompt(
  briefTitle: string,
  domain: string,
  facts: string[],
  format?: string,
  dnaSummary?: string,
) {
  return [
    "You are the FlyerMint art director doing a quality check on a finished poster.",
    "If a second image is provided, it is the visual REFERENCE. Compare STRUCTURE, not brand names.",
    "Reply with JSON only, no markdown.",
    "Keys: pass, has_person, person_natural, readable_text, text_matches_brief, domain_fit, looks_ai_generic, format_ok, composition_match, margins_ok, reference_match, design_rules, human_realism, text_readability, hierarchy, contrast, alignment, spacing, safe_zone, image_quality, domain_relevance, issues (string[]), repair_prompt (string).",
    "FAIL (pass=false) if ANY critical check fails: no visible human, plastic/waxy/AI face or bad hands, unreadable or gibberish text, invented facts, generic AI collage, wrong domain vibe, cropped edges, wrong orientation, layout that ignores the reference structure, important elements touching the edge, weak hierarchy, weak contrast, bad alignment, cramped spacing, unsafe zone, poor image quality.",
    "looks_ai_generic=true for: plastic person, random human placement, gradient-only poster, generic centered collage with no art direction, neon without reason, floating cards, 3D clutter.",
    "The poster MUST contain at least one real-looking person who belongs in the scene.",
    `Domain: ${domain}.`,
    format ? `Requested format/orientation: ${format}.` : "",
    `Title that must appear correctly: ${briefTitle}.`,
    facts.length ? `Facts that must not be altered or invented: ${facts.join(" | ")}.` : "",
    dnaSummary ? `Reference structure that MUST remain recognizable: ${dnaSummary}.` : "",
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
    const hasPerson = flag(data.has_person);
    const natural = flag(data.person_natural) && flag(data.human_realism);
    const readable = flag(data.readable_text) && flag(data.text_readability);
    const matches = flag(data.text_matches_brief);
    const domainFit = flag(data.domain_fit) && flag(data.domain_relevance);
    const formatOk = flag(data.format_ok);
    const compositionMatch = flag(data.composition_match) && flag(data.reference_match);
    const marginsOk = flag(data.margins_ok) && flag(data.safe_zone);
    const designRules = flag(data.design_rules);
    const hierarchy = flag(data.hierarchy);
    const contrast = flag(data.contrast);
    const alignment = flag(data.alignment);
    const spacing = flag(data.spacing);
    const imageQuality = flag(data.image_quality);
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
      !formatOk ||
      !compositionMatch ||
      !marginsOk ||
      !designRules ||
      !hierarchy ||
      !contrast ||
      !alignment ||
      !spacing ||
      !imageQuality;
    return {
      pass: !explicitFail,
      has_person: hasPerson,
      person_natural: natural,
      readable_text: readable,
      text_matches_brief: matches,
      domain_fit: domainFit,
      looks_ai_generic: generic,
      format_ok: formatOk,
      composition_match: compositionMatch,
      margins_ok: marginsOk,
      reference_match: compositionMatch,
      design_rules: designRules,
      human_realism: natural,
      text_readability: readable,
      hierarchy,
      contrast,
      alignment,
      spacing,
      safe_zone: marginsOk,
      image_quality: imageQuality,
      domain_relevance: domainFit,
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
  return (
    !report.has_person ||
    !report.person_natural ||
    !report.readable_text ||
    !report.text_matches_brief ||
    report.looks_ai_generic ||
    !report.composition_match ||
    !report.design_rules ||
    !report.hierarchy ||
    !report.contrast ||
    !report.alignment ||
    !report.margins_ok ||
    !report.image_quality
  );
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
      "PROBLEM: generic AI poster. Recover the attached reference structure: same crop, same human placement, same title/price/CTA zones. Not a new invented layout.",
    );
  }
  if (!report.composition_match || !report.reference_match) {
    extras.push(
      "PROBLEM: composition does not follow the attached reference. Restore the same layout: subject placement, title block, price, CTA, margins. Change facts only, not structure.",
    );
  }
  if (!report.design_rules || !report.hierarchy || !report.contrast || !report.alignment) {
    extras.push(
      "PROBLEM: design laws failed. Restore 2-3 colors, 2 type families, dominant title, strong contrast, grid alignment, grouped related facts.",
    );
  }
  if (!report.margins_ok || !report.spacing || !report.safe_zone) {
    extras.push("PROBLEM: unsafe margins or cramped spacing. Pull every important element away from the edges.");
  }
  if (!report.format_ok) {
    extras.push("PROBLEM: wrong crop or format. Respect the requested orientation, safe margins, nothing cut off.");
  }
  if (!report.image_quality) {
    extras.push("PROBLEM: weak image quality. Sharper subject, coherent light, no plastic skin, no warped anatomy.");
  }
  const hint = report.repair_prompt || report.issues.filter((issue) => issue !== "QC_SKIPPED").join("; ");
  return [
    prompt,
    "QUALITY REPAIR (mandatory):",
    hint || "Fix the failed quality checks.",
    ...extras,
    "Keep every title, date, price, phone and CTA exactly as given.",
    "One photoreal human, natural skin, correct hands, no plastic AI face.",
    "Keep the reference STRUCTURE. Replace information only.",
    "No gibberish letters. No extra invented headlines.",
  ].join("\n");
}
