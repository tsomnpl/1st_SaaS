export type CreativeDna = {
  referenceId: string;
  domain: string;
  background: string;
  composition: string;
  layout: string;
  humanPlacement: string;
  subjectScale: string;
  textPosition: string;
  titleHierarchy: string;
  humanRole: string;
  imageTreatment: string;
  typographyHierarchy: string;
  colorPalette: string[];
  contrast: string;
  spacing: string;
  whiteSpace: string;
  margins: string;
  safeZone: string;
  ctaPosition: string;
  pricePosition: string;
  mood: string;
  visualDensity: string;
  aspectRatio: string;
};

export const EMPTY_DNA: CreativeDna = {
  referenceId: "",
  domain: "",
  background: "",
  composition: "",
  layout: "",
  humanPlacement: "",
  subjectScale: "",
  textPosition: "",
  titleHierarchy: "",
  humanRole: "",
  imageTreatment: "",
  typographyHierarchy: "",
  colorPalette: [],
  contrast: "",
  spacing: "",
  whiteSpace: "",
  margins: "",
  safeZone: "",
  ctaPosition: "",
  pricePosition: "",
  mood: "",
  visualDensity: "",
  aspectRatio: "3:4",
};

function clip(value: unknown, max: number) {
  return String(value ?? "").slice(0, max);
}

export function parseCreativeDna(raw: string, fallback: Pick<CreativeDna, "referenceId" | "domain">): CreativeDna {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return { ...EMPTY_DNA, ...fallback };
  }
  try {
    const data = JSON.parse(match[0]) as Partial<CreativeDna> & {
      typographyStyle?: string;
      density?: string;
      humanPosition?: string;
    };
    const palette = Array.isArray(data.colorPalette)
      ? data.colorPalette.map(String).slice(0, 4)
      : [];
    return {
      referenceId: fallback.referenceId,
      domain: fallback.domain,
      background: clip(data.background, 240),
      composition: clip(data.composition, 400),
      layout: clip(data.layout, 240),
      humanPlacement: clip(data.humanPlacement || data.humanPosition, 240),
      subjectScale: clip(data.subjectScale, 160),
      textPosition: clip(data.textPosition, 200),
      titleHierarchy: clip(data.titleHierarchy, 200),
      humanRole: clip(data.humanRole, 160),
      imageTreatment: clip(data.imageTreatment, 240),
      typographyHierarchy: clip(data.typographyHierarchy || data.typographyStyle, 240),
      colorPalette: palette,
      contrast: clip(data.contrast, 160),
      spacing: clip(data.spacing, 160),
      whiteSpace: clip(data.whiteSpace, 160),
      margins: clip(data.margins, 160),
      safeZone: clip(data.safeZone, 160),
      ctaPosition: clip(data.ctaPosition, 160),
      pricePosition: clip(data.pricePosition, 160),
      mood: clip(data.mood, 80),
      visualDensity: clip(data.visualDensity || data.density, 80),
      aspectRatio: clip(data.aspectRatio || "3:4", 16),
    };
  } catch {
    return { ...EMPTY_DNA, ...fallback };
  }
}

export function dnaHasStructure(dna: CreativeDna | null | undefined) {
  if (!dna) return false;
  return Boolean(dna.composition || dna.layout || dna.humanPlacement);
}

export function dnaPromptBlock(dna: CreativeDna) {
  return [
    `CREATIVE DNA of the attached reference (id ${dna.referenceId}, domain ${dna.domain}):`,
    `BACKGROUND: ${dna.background || "follow the attached image"}.`,
    `COMPOSITION / structure to KEEP: ${dna.composition || "follow the attached image"}.`,
    `LAYOUT: ${dna.layout}. HUMAN_POSITION: ${dna.humanPlacement}. SUBJECT_SCALE: ${dna.subjectScale}.`,
    `TEXT_POSITION: ${dna.textPosition}. TITLE_HIERARCHY: ${dna.titleHierarchy || dna.typographyHierarchy}.`,
    `HUMAN role in scene: ${dna.humanRole}. IMAGE_TREATMENT: ${dna.imageTreatment}.`,
    `TYPOGRAPHY_STYLE: ${dna.typographyHierarchy}. Palette: ${(dna.colorPalette ?? []).join(", ") || "adapt from reference"}.`,
    `CONTRAST: ${dna.contrast}. SPACING: ${dna.spacing}. WHITE_SPACE: ${dna.whiteSpace}.`,
    `MARGINS: ${dna.margins}. SAFE_ZONE: ${dna.safeZone || dna.spacing}.`,
    `CTA_POSITION: ${dna.ctaPosition}. PRICE_POSITION: ${dna.pricePosition}.`,
    `MOOD: ${dna.mood}. DENSITY: ${dna.visualDensity}. ASPECT_RATIO: ${dna.aspectRatio}.`,
    "Reproduce this STRUCTURE. Replace every brand name, logo, phone, date, price and headline with the client's facts.",
    "Do not copy identifiable people, logos or protected copy from the reference.",
  ].join("\n");
}

export function dnaSummaryLine(dna: CreativeDna | null | undefined) {
  if (!dna || !dnaHasStructure(dna)) return "";
  return [
    dna.layout,
    dna.humanPlacement,
    dna.textPosition,
    dna.ctaPosition,
    dna.pricePosition,
    dna.safeZone || dna.margins,
  ]
    .filter(Boolean)
    .join(" | ");
}
