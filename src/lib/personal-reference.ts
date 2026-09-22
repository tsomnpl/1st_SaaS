import { CREATION_MODE_IDS, modeRequiresPersonalReference, type CreationModeId } from "@/lib/creation-modes";
import type { ArtDirection, CreateBriefInput } from "@/lib/flyermint";
import { OFFICIAL_PLANS } from "@/lib/plans";

export const PERSONAL_REFERENCE_PLAN_CODES = ["PACK_20K", "PACK_25K"] as const;
export type PersonalReferencePlanCode = (typeof PERSONAL_REFERENCE_PLAN_CODES)[number];

export const PERSONAL_REFERENCE_GENERATION_BLOCK = [
  "PERSONAL VISUAL REFERENCE",
  "The supplied image is a visual composition reference for this generation.",
  "Analyze and preserve its visual grammar:",
  "- framing;",
  "- composition;",
  "- relative placement;",
  "- perspective;",
  "- depth;",
  "- borders;",
  "- visual hierarchy;",
  "- negative space;",
  "- graphic structure.",
  "Do not reproduce the original commercial content.",
  "Replace the original:",
  "- brand;",
  "- logo;",
  "- product;",
  "- price;",
  "- slogan;",
  "- contact;",
  "- commercial information",
  "with the user's supplied content.",
  "Adapt colors, objects and graphical details when necessary to make the new design coherent.",
  "The goal is to transpose the composition to the user's product, not to reproduce the original commercial identity.",
].join("\n");

export type AssetRole = "PERSONAL_REFERENCE" | "USER_LOGO" | "USER_PRODUCT" | "SECONDARY" | "FLYERMINT_INTERNAL";

export type BitmapAttachment = {
  role: AssetRole;
  dataUrl: string;
};

export type PersonalReferenceAnalysis = {
  format: string;
  composition: string;
  framing: string;
  perspective: string;
  hierarchy: string[];
  colors: string[];
  typography: string;
  borders: string;
  depth: string;
  graphicElements: string[];
  subjectPlacement: string;
  negativeSpace: string;
};

export type PersonalReferenceAccess = {
  brief: CreateBriefInput;
  personalReferenceDenied: boolean;
  personalReferenceUsed: boolean;
};

const EMPTY_ANALYSIS: PersonalReferenceAnalysis = {
  format: "",
  composition: "",
  framing: "",
  perspective: "",
  hierarchy: [],
  colors: [],
  typography: "",
  borders: "",
  depth: "",
  graphicElements: [],
  subjectPlacement: "",
  negativeSpace: "",
};

export function planCodeAllowsPersonalReference(code: string | undefined | null) {
  return Boolean(code && (PERSONAL_REFERENCE_PLAN_CODES as readonly string[]).includes(code));
}

export function personalReferencePlanLabels() {
  return OFFICIAL_PLANS.filter((plan) => planCodeAllowsPersonalReference(plan.code)).map((plan) => ({
    code: plan.code,
    priceFcfa: plan.priceFcfa,
    mintAmount: plan.mintAmount,
  }));
}

export function standardGenerationPlans() {
  return OFFICIAL_PLANS.filter((plan) => plan.priceFcfa > 0);
}

export function hasPersonalReferenceImage(brief: Pick<CreateBriefInput, "personalReferenceUrl">) {
  return Boolean(brief.personalReferenceUrl);
}

export function applyPersonalReferenceAccess(brief: CreateBriefInput, entitled: boolean): PersonalReferenceAccess {
  const mode = brief.creationMode as CreationModeId;
  const hasImage = hasPersonalReferenceImage(brief);

  if (modeRequiresPersonalReference(mode) && !entitled) {
    throw new Error("PERSONAL_REFERENCE_PREMIUM");
  }
  if (modeRequiresPersonalReference(mode) && entitled && !hasImage) {
    throw new Error("PERSONAL_REFERENCE_REQUIRED");
  }
  if (hasImage && !entitled) {
    return {
      brief: { ...brief, personalReferenceUrl: undefined },
      personalReferenceDenied: true,
      personalReferenceUsed: false,
    };
  }
  return {
    brief,
    personalReferenceDenied: false,
    personalReferenceUsed: hasImage,
  };
}

export function classifyGenerationAssets(brief: CreateBriefInput): { role: AssetRole; present: boolean }[] {
  return [
    { role: "PERSONAL_REFERENCE", present: Boolean(brief.personalReferenceUrl) },
    { role: "USER_PRODUCT", present: Boolean(brief.mainImageUrl) },
    { role: "USER_LOGO", present: Boolean(brief.logoUrl) },
    { role: "SECONDARY", present: Boolean(brief.secondaryImageUrl) },
  ];
}

function isDataImage(value: string | undefined) {
  return Boolean(value?.startsWith("data:image/"));
}

export function orderedBitmapAttachments(
  brief: CreateBriefInput,
  internalStyleDataUrl?: string,
): BitmapAttachment[] {
  if (isDataImage(brief.personalReferenceUrl)) {
    const premium: BitmapAttachment[] = [{ role: "PERSONAL_REFERENCE", dataUrl: brief.personalReferenceUrl as string }];
    if (isDataImage(brief.mainImageUrl)) {
      premium.push({ role: "USER_PRODUCT", dataUrl: brief.mainImageUrl as string });
    }
    if (isDataImage(brief.logoUrl)) {
      premium.push({ role: "USER_LOGO", dataUrl: brief.logoUrl as string });
    }
    if (isDataImage(brief.secondaryImageUrl)) {
      premium.push({ role: "SECONDARY", dataUrl: brief.secondaryImageUrl as string });
    }
    return premium.slice(0, 4);
  }

  if (isDataImage(brief.mainImageUrl)) {
    return [{ role: "USER_PRODUCT", dataUrl: brief.mainImageUrl as string }];
  }
  if (isDataImage(brief.logoUrl)) {
    return [{ role: "USER_LOGO", dataUrl: brief.logoUrl as string }];
  }
  if (isDataImage(internalStyleDataUrl)) {
    return [{ role: "FLYERMINT_INTERNAL", dataUrl: internalStyleDataUrl as string }];
  }
  return [];
}

export function assetRolesPrompt(brief: CreateBriefInput) {
  const lines = [
    "IMAGE ROLES (never mix these up):",
    brief.personalReferenceUrl
      ? "PERSONAL_REFERENCE = composition grammar to transpose. Not the client's product. Do not copy original brand, logo, price or contact."
      : "",
    brief.mainImageUrl
      ? "USER_PRODUCT = the client's product, person or photo to integrate as the real subject. Do not replace it with a generated lookalike."
      : "",
    brief.logoUrl
      ? "USER_LOGO = the client's real logo. Integrate it as-is. Do not redraw, restyle or invent another mark."
      : "",
    brief.secondaryImageUrl
      ? "SECONDARY = supporting client image. Use only if it helps the composition."
      : "",
    "FLYERMINT_INTERNAL references remain in the written Creative DNA. They inform craft for every plan. They are not replaced by a personal poster.",
  ];
  return lines.filter(Boolean).join("\n");
}

export const PERSONAL_REFERENCE_ANALYSIS_PROMPT = [
  "You are FlyerMint's art director. Analyze this PERSONAL poster as a COMPOSITION GRAMMAR to transpose.",
  "Do not transcribe brand names, logos, prices, phone numbers, slogans or identifiable people.",
  "The important information is STRUCTURE: how the spectator looks through the layout, where the subject sits, how borders frame the scene.",
  "Example: if a spectator looks through an opening in packaging with a character behind it, report that spatial device — not 'a man in red'.",
  "Return JSON only with keys:",
  "format (portrait|square|landscape plus proportions),",
  "composition (spatial structure, blocks, empty zones),",
  "framing (shot, angle, crop),",
  "perspective,",
  "hierarchy (string[]: first, second, third thing the eye sees),",
  "colors (string[] descriptive swatches, not brand names),",
  "typography (weight, relative size, alignment, placement — no original copy),",
  "borders (presence, thickness, shape, position, interaction with subject/text),",
  "depth (foreground, subject, background, overlap, shadows),",
  "graphicElements (string[] frames, lines, badges, shapes, textures, motifs),",
  "subjectPlacement (center|left|right plus foreground/background),",
  "negativeSpace.",
].join(" ");

function clip(value: unknown, max: number) {
  return String(value ?? "").slice(0, max).trim();
}

export function parsePersonalReferenceAnalysis(raw: string): PersonalReferenceAnalysis | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]) as Partial<PersonalReferenceAnalysis>;
    const hierarchy = Array.isArray(data.hierarchy) ? data.hierarchy.map((item) => clip(item, 160)).filter(Boolean).slice(0, 6) : [];
    const colors = Array.isArray(data.colors) ? data.colors.map((item) => clip(item, 40)).filter(Boolean).slice(0, 4) : [];
    const graphicElements = Array.isArray(data.graphicElements)
      ? data.graphicElements.map((item) => clip(item, 120)).filter(Boolean).slice(0, 8)
      : [];
    const parsed: PersonalReferenceAnalysis = {
      format: clip(data.format, 80),
      composition: clip(data.composition, 500),
      framing: clip(data.framing, 240),
      perspective: clip(data.perspective, 240),
      hierarchy,
      colors,
      typography: clip(data.typography, 240),
      borders: clip(data.borders, 280),
      depth: clip(data.depth, 280),
      graphicElements,
      subjectPlacement: clip(data.subjectPlacement, 160),
      negativeSpace: clip(data.negativeSpace, 200),
    };
    const hasStructure = Boolean(parsed.composition || parsed.framing || parsed.perspective || parsed.borders);
    return hasStructure ? parsed : { ...EMPTY_ANALYSIS, ...parsed };
  } catch {
    return null;
  }
}

export function personalReferenceSummary(analysis: PersonalReferenceAnalysis | null) {
  if (!analysis) return "";
  return [
    analysis.composition,
    analysis.framing && `framing: ${analysis.framing}`,
    analysis.perspective && `perspective: ${analysis.perspective}`,
    analysis.borders && `borders: ${analysis.borders}`,
    analysis.depth && `depth: ${analysis.depth}`,
    analysis.hierarchy.length ? `hierarchy: ${analysis.hierarchy.join(" > ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export function personalReferencePromptSection(analysis: PersonalReferenceAnalysis | null) {
  const details = analysis
    ? [
        `Format: ${analysis.format || "match the personal poster"}.`,
        `Composition grammar: ${analysis.composition || "preserve relative placement and blocks"}.`,
        `Framing: ${analysis.framing || "same crop and shot size"}.`,
        `Perspective: ${analysis.perspective || "same camera logic"}.`,
        `Subject placement: ${analysis.subjectPlacement || "same relative position"}.`,
        `Hierarchy: ${analysis.hierarchy.join(" > ") || "keep the same reading order"}.`,
        `Borders / frames: ${analysis.borders || "keep border logic if present — do not drop them as decoration"}.`,
        `Depth: ${analysis.depth || "keep foreground / subject / background stacking"}.`,
        `Typography rhythm: ${analysis.typography || "same weight contrast and placement, new copy"}.`,
        `Negative space: ${analysis.negativeSpace || "same breathing rhythm"}.`,
        analysis.graphicElements.length ? `Graphic devices: ${analysis.graphicElements.join(", ")}.` : "",
        analysis.colors.length ? `Reference palette (adapt, do not copy branded hues blindly): ${analysis.colors.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "No structured analysis JSON; still obey the attached PERSONAL_REFERENCE bitmap as composition grammar.";

  return [PERSONAL_REFERENCE_GENERATION_BLOCK, details].join("\n");
}

export function enrichArtDirectionWithPersonalReference(
  ad: ArtDirection,
  analysis: PersonalReferenceAnalysis | null,
): ArtDirection {
  if (!analysis && !ad) return ad;
  const composition = analysis?.composition
    ? `${analysis.composition} (personal grammar; FlyerMint internal craft still applies)`
    : ad.composition;
  const hierarchy = analysis?.hierarchy.length ? analysis.hierarchy : ad.visual_hierarchy;
  const personalPrinciples = [
    "Personal poster = composition grammar for THIS generation only. It is not added to the FlyerMint global library.",
    "Preserve framing, relative placement, perspective, depth, borders, hierarchy and negative space.",
    "Replace original brand, logo, product, price, slogan and contact with the client's facts.",
    "Internal FlyerMint references remain active for domain craft.",
    analysis?.borders ? `Keep border logic: ${analysis.borders}` : "",
    analysis?.perspective ? `Keep perspective: ${analysis.perspective}` : "",
  ].filter(Boolean);

  return {
    ...ad,
    composition,
    visual_hierarchy: hierarchy.length ? hierarchy : ad.visual_hierarchy,
    color_palette: ad.color_palette,
    negative_space: analysis?.negativeSpace || ad.negative_space,
    reference_principles: [...personalPrinciples, ...ad.reference_principles],
  };
}

export function isKnownCreationMode(value: string): value is CreationModeId {
  return (CREATION_MODE_IDS as readonly string[]).includes(value);
}
