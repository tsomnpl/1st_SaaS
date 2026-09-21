export type CreativeDna = {
  referenceId: string;
  domain: string;
  composition: string;
  layout: string;
  humanPlacement: string;
  humanRole: string;
  imageTreatment: string;
  typographyHierarchy: string;
  colorPalette: string[];
  contrast: string;
  spacing: string;
  ctaPosition: string;
  mood: string;
  visualDensity: string;
  aspectRatio: string;
};

export const EMPTY_DNA: CreativeDna = {
  referenceId: "",
  domain: "",
  composition: "",
  layout: "",
  humanPlacement: "",
  humanRole: "",
  imageTreatment: "",
  typographyHierarchy: "",
  colorPalette: [],
  contrast: "",
  spacing: "",
  ctaPosition: "",
  mood: "",
  visualDensity: "",
  aspectRatio: "3:4",
};

export function parseCreativeDna(raw: string, fallback: Pick<CreativeDna, "referenceId" | "domain">): CreativeDna {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return { ...EMPTY_DNA, ...fallback };
  }
  try {
    const data = JSON.parse(match[0]) as Partial<CreativeDna>;
    const palette = Array.isArray(data.colorPalette)
      ? data.colorPalette.map(String).slice(0, 4)
      : [];
    return {
      referenceId: fallback.referenceId,
      domain: fallback.domain,
      composition: String(data.composition ?? "").slice(0, 400),
      layout: String(data.layout ?? "").slice(0, 240),
      humanPlacement: String(data.humanPlacement ?? "").slice(0, 240),
      humanRole: String(data.humanRole ?? "").slice(0, 160),
      imageTreatment: String(data.imageTreatment ?? "").slice(0, 240),
      typographyHierarchy: String(data.typographyHierarchy ?? "").slice(0, 240),
      colorPalette: palette,
      contrast: String(data.contrast ?? "").slice(0, 160),
      spacing: String(data.spacing ?? "").slice(0, 160),
      ctaPosition: String(data.ctaPosition ?? "").slice(0, 160),
      mood: String(data.mood ?? "").slice(0, 80),
      visualDensity: String(data.visualDensity ?? "").slice(0, 80),
      aspectRatio: String(data.aspectRatio ?? "3:4").slice(0, 16),
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
    `CREATIVE DNA of the attached reference (id ${dna.referenceId}):`,
    `Composition / structure to KEEP: ${dna.composition || "follow the attached image"}.`,
    `Layout: ${dna.layout}. Human placement: ${dna.humanPlacement}. Human role in scene: ${dna.humanRole}.`,
    `Image treatment: ${dna.imageTreatment}. Typography hierarchy: ${dna.typographyHierarchy}.`,
    `Palette principle: ${(dna.colorPalette ?? []).join(", ") || "adapt from reference"}. Contrast: ${dna.contrast}.`,
    `Spacing / safe zone: ${dna.spacing}. CTA position: ${dna.ctaPosition}.`,
    `Mood: ${dna.mood}. Density: ${dna.visualDensity}. Aspect: ${dna.aspectRatio}.`,
    "Reproduce this STRUCTURE. Replace every brand name, logo, phone, date, price and headline with the client's facts.",
    "Do not copy identifiable people, logos or protected copy from the reference.",
  ].join("\n");
}
