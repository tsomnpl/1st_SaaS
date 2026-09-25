import { findLeftovers } from "@/lib/reference-selection";

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
  visible_text?: string[];
  typos?: Array<{ found: string; expected: string }>;
  structure_score?: number;
  leftovers?: string[];
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
  options: { referenceCopy?: boolean; composition?: boolean } = {},
) {
  const structureRule =
    "structure_score: integer 0-10, how closely the first image keeps the structure of the reference (subject position and proportions, title position, blocks, rectangles, frames, CTA, logo spot, colors, typography, hierarchy, graphic elements, spacing, format). 10 = same poster structure. A pretty poster with another layout scores low.";
  const rules = options.composition
    ? [
        "The second image is the REFERENCE poster. The first image must keep its visual grammar (zones, proportions, hierarchy, subject/text relationship, CTA and brand areas) with new content.",
        structureRule,
        "Set composition_match=false if blocks moved (e.g. subject left became centered, title right became top), or if it looks like a different layout.",
        "FAIL if any original word, name, phone, date, price, handle or brand of the reference is visible.",
      ]
    : options.referenceCopy
    ? [
        structureRule,
        "The second image is the REFERENCE poster. The first image must be the SAME poster with only the text, faces and logo changed.",
        "Set composition_match=false and reference_match=false if the layout, fonts, text boxes/cards/bands, colors, background, hands or the number/poses of people changed, or if it looks simplified compared with the reference.",
        "FAIL if any original word, name, phone, date, price or brand of the reference is still visible.",
        "has_person=true when the result keeps the people of the reference (true if the reference has no person).",
        "design_rules=true when the result follows the reference design (do not apply generic color/font limits).",
      ]
    : [
        "If a second image is provided, it is the visual REFERENCE. Compare STRUCTURE, not brand names.",
        "FAIL (pass=false) if ANY critical check fails: no visible human, plastic/waxy/AI face or bad hands, unreadable or gibberish text, invented facts, generic AI collage, wrong domain vibe, cropped edges, wrong orientation, layout that ignores the reference structure, important elements touching the edge, weak hierarchy, weak contrast, bad alignment, cramped spacing, unsafe zone, poor image quality.",
        "looks_ai_generic=true for: plastic person, random human placement, gradient-only poster, generic centered collage with no art direction, neon without reason, floating cards, 3D clutter.",
        "The poster MUST contain at least one real-looking person who belongs in the scene.",
      ];
  return [
    "You are the FlyerMint art director doing a quality check on a finished poster (first image).",
    "Reply with JSON only, no markdown.",
    "Keys: pass, structure_score (number, only when a reference is provided), has_person, person_natural, readable_text, text_matches_brief, domain_fit, looks_ai_generic, format_ok, composition_match, margins_ok, reference_match, design_rules, human_realism, text_readability, hierarchy, contrast, alignment, spacing, safe_zone, image_quality, domain_relevance, visible_text (string[]), issues (string[]), repair_prompt (string).",
    "visible_text: transcribe EVERY word visible on the first image exactly as written, letter by letter, including misspellings. Do not correct anything.",
    "text_matches_brief=false if any word is misspelled compared with the facts below, or if a word not in the facts was added (field names like 'artistes:' count as added).",
    ...rules,
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
    const visibleText = Array.isArray(data.visible_text) ? data.visible_text.map(String).slice(0, 80) : undefined;
    const structureScore = Number.isFinite(Number(data.structure_score)) ? Number(data.structure_score) : undefined;
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
      visible_text: visibleText,
      structure_score: structureScore,
    };
  } catch {
    return skippedQcReport();
  }
}

const TEXT_WHITELIST = new Set([
  "flyermint", "fcfa", "whatsapp", "phone", "telephone", "contact", "contactez", "date", "heure", "lieu", "prix",
  "infos", "info", "www", "com", "avec", "pour", "nous", "votre", "notre", "seulement", "au", "lieu", "de",
]);

function normalizeWord(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function words(value: string) {
  return normalizeWord(value).split(/[^a-z0-9]+/).filter((word) => word.length >= 4 && !/^\d+$/.test(word));
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** Words on the poster that are one or two letters away from a word the client typed: misspellings. */
export function findTypos(visibleText: string[], allowedText: string[]) {
  const allowed = new Set([...allowedText.flatMap(words), ...TEXT_WHITELIST]);
  const typos: Array<{ found: string; expected: string }> = [];
  const seen = new Set<string>();
  for (const word of visibleText.flatMap(words)) {
    if (allowed.has(word) || seen.has(word)) continue;
    seen.add(word);
    let best: { word: string; distance: number } | null = null;
    for (const candidate of allowed) {
      if (Math.abs(candidate.length - word.length) > 2) continue;
      const distance = editDistance(word, candidate);
      if (distance <= (word.length >= 7 ? 2 : 1) && (!best || distance < best.distance)) best = { word: candidate, distance };
    }
    if (best) typos.push({ found: word, expected: best.word });
  }
  return typos;
}

/** Fold the server-side spelling check into the vision QC report. */
export function applyTextCheck(report: PosterQcReport, allowedText: string[]): PosterQcReport {
  if (!report.visible_text?.length) return report;
  const typos = findTypos(report.visible_text, allowedText);
  if (!typos.length) return { ...report, typos };
  return {
    ...report,
    pass: false,
    text_matches_brief: false,
    typos,
    issues: [...report.issues, ...typos.map((typo) => `TYPO: "${typo.found}" au lieu de "${typo.expected}"`)].slice(0, 12),
    repair_prompt: [
      report.repair_prompt,
      `Fix the misspelled words: ${typos.map((typo) => `"${typo.found}" must be written exactly as in the client text (closest: "${typo.expected}")`).join("; ")}.`,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export const MIN_STRUCTURE_SCORE = 7;

/** Reference fidelity is judged on structure and content, never on beauty. */
export function applyReferenceCheck(
  report: PosterQcReport,
  input: { originalText: string[]; clientText: string[]; strictStructure: boolean },
): PosterQcReport {
  if (qcWasSkipped(report)) return report;
  const leftovers = report.visible_text?.length ? findLeftovers(report.visible_text, input.originalText, input.clientText) : [];
  const weakStructure =
    input.strictStructure && (report.structure_score === undefined || report.structure_score < MIN_STRUCTURE_SCORE);
  if (!leftovers.length && !weakStructure) return { ...report, leftovers };
  return {
    ...report,
    pass: false,
    composition_match: weakStructure ? false : report.composition_match,
    reference_match: weakStructure ? false : report.reference_match,
    text_matches_brief: leftovers.length ? false : report.text_matches_brief,
    leftovers,
    issues: [
      ...report.issues,
      ...(weakStructure ? [`STRUCTURE: ${report.structure_score ?? "?"}/10 < ${MIN_STRUCTURE_SCORE}`] : []),
      ...leftovers.map((word) => `ANCIEN CONTENU: "${word}"`),
    ].slice(0, 14),
    repair_prompt: [
      report.repair_prompt,
      leftovers.length ? `Remove every original text of the reference still visible: ${leftovers.join(", ")}.` : "",
      weakStructure ? "The layout drifted from the reference: restore the same block positions, proportions and shapes." : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
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

export function applyRepair(prompt: string, report: PosterQcReport, options: { referenceCopy?: boolean } = {}) {
  if (options.referenceCopy) {
    const hint = report.repair_prompt || report.issues.filter((issue) => issue !== "QC_SKIPPED").join("; ");
    return [
      prompt,
      "QUALITY REPAIR (mandatory):",
      hint || "Fix the failed quality checks.",
      !report.composition_match || report.looks_ai_generic
        ? "PROBLEM: the result drifted from the reference. Copy the reference poster again: same layout, fonts, boxes, colors, background, people poses. Change the text only."
        : "",
      report.typos?.length ? `PROBLEM: misspelled words (${report.typos.map((typo) => typo.found).join(", ")}). Write every client word letter by letter.` : "",
      "Keep every title, date, price, phone and CTA exactly as given. No extra words, no field names.",
    ]
      .filter(Boolean)
      .join("\n");
  }
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
