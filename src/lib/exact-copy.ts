import type { ArtDirection, CreateBriefInput } from "@/lib/flyermint";
import type { ReferenceSelection } from "@/lib/reference-select";

export const EXACT_COPY_MODEL = "google/gemini-3-pro-image";
export const EXACT_COPY_MODE = "EXACT_COPY";

export function isExactCopy(brief: Pick<CreateBriefInput, "creativeFreedom">) {
  return brief.creativeFreedom === "copie_exacte";
}

type Slot = { key: string; label: string; value: string };

function clean(value: string | undefined) {
  const text = value?.trim() ?? "";
  return text.length ? text : "";
}

export function exactCopySlots(brief: CreateBriefInput) {
  const price = [clean(brief.newPrice), clean(brief.price), clean(brief.oldPrice)].filter(Boolean).join(" / ");
  const phone = [clean(brief.contactPhone), clean(brief.whatsapp)].filter(Boolean).join(" / ");
  const provided: Slot[] = [
    { key: "title", label: "titre", value: clean(brief.title) },
    { key: "subtitle", label: "sous-titre", value: clean(brief.subtitle) },
    { key: "body", label: "texte d'offre", value: clean(brief.description) },
    { key: "date", label: "date", value: clean(brief.date) },
    { key: "time", label: "heure", value: clean(brief.time) },
    { key: "price", label: "prix", value: price },
    { key: "address", label: "adresse", value: clean(brief.location) },
    { key: "phone", label: "telephone", value: phone },
    { key: "email", label: "email", value: clean(brief.email) },
    { key: "cta", label: "CTA", value: clean(brief.cta) },
  ].filter((slot) => slot.value);

  const removed = [
    !clean(brief.subtitle) ? "sous-titre" : "",
    !clean(brief.description) ? "texte d'offre / liste" : "",
    !clean(brief.date) ? "date" : "",
    !clean(brief.time) ? "heure" : "",
    !price ? "prix" : "",
    !clean(brief.location) ? "adresse" : "",
    !phone ? "telephone" : "",
    !clean(brief.email) ? "email" : "",
    !clean(brief.cta) ? "bouton ou bande CTA" : "",
    !brief.logoUrl ? "logo et nom de marque" : "",
  ].filter(Boolean);

  return { provided, removed };
}

function wantsReplacementIdentity(brief: CreateBriefInput) {
  const text = `${brief.style ?? ""} ${brief.description ?? ""} ${brief.subtitle ?? ""}`.toLowerCase();
  return text.includes("flyermint") || text.includes("logo de remplacement");
}

export function buildExactCopyPrompt(brief: CreateBriefInput, selection: ReferenceSelection | null) {
  const { provided, removed } = exactCopySlots(brief);
  const accent = brief.colors.find((color) => color.trim())?.trim();
  const ref = selection?.selected;
  const lines = [
    "Modify the supplied reference poster. Keep its composition and visual structure. Replace only the elements allowed by the new brief.",
    "Do not create a new design. Do not invent a new grid, a new hierarchy, a new crop, or a new layout.",
    "The original reference is the priority. Do not apply a 2-3 color limit, an official FlyerMint palette, or a single-hero recomposition.",
    ref
      ? `Reference id ${ref.id}. Storage path ${ref.storagePath}. Domain ${selection?.domain}. Stay on this poster.`
      : "A reference image is attached. Stay on that poster.",
    "Allowed changes: texts, people or faces when a new person is required, and the logo.",
    brief.mainImageUrl
      ? "Replace the person with the client photo. Keep the same position, pose, framing, visual role, and relation to the other elements."
      : "Keep the existing person in the same position, pose, framing, and visual role. Do not add or remove people.",
    brief.logoUrl
      ? "Replace the logo slot with the client logo. Remove the old brand."
      : wantsReplacementIdentity(brief)
        ? "No client logo was provided. Put the word FLYERMINT only in the existing logo slot."
        : "No replacement identity was requested. Remove the old logo and the old brand name. Do not add a FLYERMINT badge.",
    "Put each new fact in the matching slot of the original:",
    ...provided.map((slot) => `- ${slot.label} replaces the original ${slot.label}: "${slot.value}"`),
    "Delete the old element when the new brief does not provide that fact. Remove these slots completely:",
    ...removed.map((slot) => `- ${slot}`),
    "Never keep an old word, number, date, price, name, brand, logo, or contact that is not in the replace list.",
    "Do not print the objective or the audience as poster copy.",
    accent
      ? `Accent color only: change the matching accent to ${accent}. Do not recolor the whole poster.`
      : "Do not recolor the poster. Keep the reference colors.",
    `Format stays ${brief.format}.`,
    "A pretty poster that changes the composition or keeps old content is a failure.",
  ];
  return lines.join("\n");
}

export function exactCopyArtDirection(brief: CreateBriefInput, selection: ReferenceSelection | null): Partial<ArtDirection> {
  const accent = brief.colors.filter((color) => color.trim()).slice(0, 1);
  const ref = selection?.selected;
  return {
    concept: "Copie exacte: modifier la reference, conserver la composition",
    composition: ref?.texts || "Conserver la structure visuelle de la reference",
    color_palette: accent.length ? accent : ref?.palette?.length ? ref.palette : ["palette de la reference"],
    visual_hierarchy: ["Conserver l'emplacement du titre et des blocs de la reference"],
    reference_principles: [
      "structure originale prioritaire",
      "remplacer textes, personne si besoin, logo",
      "supprimer les informations absentes du brief",
    ],
    reference_ids: ref ? [ref.id] : [],
    avoid: [
      "nouvelle grille",
      "nouvelle composition",
      "recoloration totale",
      "ancien texte, ancien prix, ancienne date, ancien logo",
    ],
  };
}

export type ExactCopyQc = {
  pass: boolean;
  composition_match: boolean;
  leftover_old_content: boolean;
  brief_content_present: boolean;
  omitted_slots_removed: boolean;
  pretty_but_wrong: boolean;
  issues: string[];
  repair_prompt: string;
};

const FAILED_QC: ExactCopyQc = {
  pass: false,
  composition_match: false,
  leftover_old_content: true,
  brief_content_present: false,
  omitted_slots_removed: false,
  pretty_but_wrong: true,
  issues: ["QC_UNREADABLE"],
  repair_prompt: "Keep the reference composition and remove every old word that is not in the new brief.",
};

export function exactCopyQcPrompt(brief: CreateBriefInput, selection: ReferenceSelection | null) {
  const { provided, removed } = exactCopySlots(brief);
  return [
    "Compare image 1 (REFERENCE) with image 2 (RESULT).",
    "Reply with JSON only.",
    "Keys: pass, composition_match, leftover_old_content, brief_content_present, omitted_slots_removed, pretty_but_wrong, issues, repair_prompt.",
    "composition_match is true only if the person position, proportions, title placement, blocks, rectangles, frames, spacing, colors, typography and format still match the reference.",
    "leftover_old_content is true if any old word, number, price, date, name, brand, logo or contact from the reference remains and is not in the new brief.",
    "Do not pass a poster only because it looks pretty. pretty_but_wrong is true when it is attractive but the structure changed or old content remains.",
    "pass is true only when composition_match, brief_content_present and omitted_slots_removed are true, and leftover_old_content and pretty_but_wrong are false.",
    `New texts that must appear: ${provided.map((slot) => `${slot.label}=${slot.value}`).join(" | ") || brief.title}.`,
    `Slots that must be gone: ${removed.join(", ") || "none"}.`,
    selection?.selected ? `Reference id ${selection.selected.id}.` : "",
    "repair_prompt: one English instruction to restore the reference structure and delete leftover old content, or empty if pass.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function parseExactCopyQc(raw: string): ExactCopyQc {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { ...FAILED_QC };
  try {
    const data = JSON.parse(jsonMatch[0]) as Partial<ExactCopyQc>;
    const composition = data.composition_match === true;
    const leftover = data.leftover_old_content !== false;
    const present = data.brief_content_present === true;
    const removed = data.omitted_slots_removed === true;
    const prettyWrong = data.pretty_but_wrong === true;
    const issues = Array.isArray(data.issues) ? data.issues.map(String).slice(0, 8) : [];
    const pass = data.pass === true && composition && !leftover && present && removed && !prettyWrong;
    return {
      pass,
      composition_match: composition,
      leftover_old_content: leftover,
      brief_content_present: present,
      omitted_slots_removed: removed,
      pretty_but_wrong: prettyWrong,
      issues,
      repair_prompt: String(data.repair_prompt ?? "").slice(0, 500),
    };
  } catch {
    return { ...FAILED_QC };
  }
}

export function exactCopyShouldRegenerate(report: ExactCopyQc) {
  return !report.pass;
}

export function applyExactCopyRepair(prompt: string, report: ExactCopyQc) {
  const hint = report.repair_prompt || report.issues.join("; ") || "Restore the reference composition and delete old content.";
  return [
    prompt,
    "QUALITY REPAIR, still an exact copy:",
    hint,
    "Do not redesign. Keep the reference composition.",
    "Delete every old word, number, price, date, name, brand and contact that is not in the replace list.",
    "Do not validate a pretty poster that drifts from the reference.",
  ].join("\n");
}

export type GenerationProof = {
  domain: string;
  domainSlug: string | null;
  reference: string | null;
  referenceId: string | null;
  referencePath: string | null;
  selectionReason: string;
  mode: "EXACT_COPY" | "ORIGINAL";
  model: string;
  responseModel: string | null;
  referenceUsed: boolean;
  qualityCheck: unknown;
  regenerationCount: number;
  examinedCount: number;
  examinedIds: string[];
};

export function generationProof(input: {
  brief: CreateBriefInput;
  selection: ReferenceSelection;
  model: string;
  responseModel?: string | null;
  referenceUsed: boolean;
  qualityCheck: unknown;
  regenerationCount: number;
}): GenerationProof {
  const selected = input.selection.selected;
  return {
    domain: input.brief.domain,
    domainSlug: input.selection.slug,
    reference: selected ? selected.id : null,
    referenceId: selected ? selected.id : null,
    referencePath: selected ? selected.storagePath : null,
    selectionReason: input.selection.reason,
    mode: isExactCopy(input.brief) ? "EXACT_COPY" : "ORIGINAL",
    model: input.model,
    responseModel: input.responseModel ?? null,
    referenceUsed: input.referenceUsed,
    qualityCheck: input.qualityCheck,
    regenerationCount: input.regenerationCount,
    examinedCount: input.selection.examined.length,
    examinedIds: input.selection.examined.map((ref) => ref.id),
  };
}
