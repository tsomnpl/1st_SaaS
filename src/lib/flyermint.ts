import { z } from "zod";
import { DOMAINS } from "@/lib/domains";
import { selectInspirationReferences } from "@/lib/inspiration";

const imageRef = z
  .string()
  .refine(
    (value) =>
      value.startsWith("https://") ||
      value.startsWith("http://") ||
      value.startsWith("data:image/"),
    "INVALID_IMAGE",
  )
  .optional();

export const createBriefSchema = z.object({
  visualType: z.string().min(2),
  domain: z.enum(DOMAINS),
  objective: z.string().min(2),
  targetAudience: z.string().min(2),
  title: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  oldPrice: z.string().optional(),
  newPrice: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  contactPhone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  cta: z.string().optional(),
  style: z.string().optional(),
  colors: z.array(z.string()).default([]),
  mood: z.string().optional(),
  format: z.string().min(2),
  creativeFreedom: z
    .enum(["liberte_totale", "liberte_guidee", "design_tres_precis"])
    .default("liberte_guidee"),
  mainImageUrl: imageRef,
  logoUrl: imageRef,
  adaptiveData: z.record(z.string(), z.string()).default({}),
});

export type CreateBriefInput = z.infer<typeof createBriefSchema>;

export type ArtDirection = {
  concept: string;
  main_subject: string;
  secondary_elements: string[];
  composition: string;
  visual_hierarchy: string[];
  color_palette: string[];
  typography: {
    heading: string;
    body: string;
  };
  background: string;
  lighting: string;
  mood: string;
  negative_space: string;
  cta: string;
  format: string;
  reference_principles: string[];
  reference_ids: string[];
  avoid: string[];
  differentiators: string[];
};

export function buildArtDirection(input: CreateBriefInput): ArtDirection {
  const palette =
    input.colors.length > 0 ? input.colors.slice(0, 3) : ["#1E293B", "#6D28D9", "#10B981"];
  const inspiration = selectInspirationReferences(input);

  return {
    concept: `${input.style ?? "moderne"} orientee conversion pour ${input.domain}`,
    main_subject: input.mainImageUrl ? "image utilisateur principale" : input.title,
    secondary_elements: [input.subtitle, input.description, input.location].filter(Boolean) as string[],
    composition: "hero central avec zone texte lisible et CTA contrastant",
    visual_hierarchy: [
      `Titre: ${input.title}`,
      input.price ? `Prix: ${input.price}` : "Offre principale",
      input.cta ? `CTA: ${input.cta}` : "Call to action visible",
      "Infos pratiques",
    ],
    color_palette: palette,
    typography: {
      heading: "Sans Serif Bold",
      body: "Sans Serif Regular",
    },
    background: "fond propre a contraste eleve",
    lighting: "eclairage doux axe sur le sujet principal",
    mood: input.mood ?? "professionnel",
    negative_space: "marges de respiration autour titre et CTA",
    cta: input.cta ?? "Contactez-nous",
    format: input.format,
    reference_principles: [
      "lisibilite prioritaire",
      "grille et alignements constants",
      "contraste fort texte/fond",
      "2-3 couleurs principales maximum",
      ...inspiration.principles,
    ],
    reference_ids: inspiration.selected.map((ref) => ref.id),
    avoid: [
      "texte colle aux bords",
      "effets excessifs qui nuisent a la lisibilite",
      "copie directe d'une reference",
    ],
    differentiators: [
      "angle commercial explicite selon objectif",
      "CTA calibre pour conversion",
      "structure premium reutilisable multi-format",
      "adaptation domaine automatique",
      "coherence visuelle multi-campagne",
    ],
  };
}

export function buildPrompt(input: CreateBriefInput, ad: ArtDirection) {
  return [
    "Create a professional advertising flyer.",
    `Visual type: ${input.visualType}.`,
    `Domain: ${input.domain}.`,
    `Objective: ${input.objective}.`,
    `Target audience: ${input.targetAudience}.`,
    `Title (must be clear): ${input.title}.`,
    input.subtitle ? `Subtitle: ${input.subtitle}.` : "",
    input.description ? `Description: ${input.description}.` : "",
    input.price ? `Price to preserve exactly: ${input.price}.` : "",
    input.oldPrice ? `Old price: ${input.oldPrice}.` : "",
    input.newPrice ? `New price: ${input.newPrice}.` : "",
    input.date ? `Date to preserve: ${input.date}.` : "",
    input.time ? `Time to preserve: ${input.time}.` : "",
    input.location ? `Location to preserve: ${input.location}.` : "",
    input.contactPhone ? `Phone to preserve: ${input.contactPhone}.` : "",
    input.whatsapp ? `WhatsApp to preserve: ${input.whatsapp}.` : "",
    input.email ? `Email to preserve: ${input.email}.` : "",
    `Format: ${input.format}.`,
    `Creative freedom: ${input.creativeFreedom}.`,
    `Main composition: ${ad.composition}.`,
    `Visual hierarchy: ${ad.visual_hierarchy.join(" | ")}.`,
    `Palette: ${ad.color_palette.join(", ")}.`,
    `Mood: ${ad.mood}.`,
    `Lighting: ${ad.lighting}.`,
    `Background: ${ad.background}.`,
    `Negative space: ${ad.negative_space}.`,
    `CTA: ${ad.cta}.`,
    `Reference principles: ${ad.reference_principles.join(" || ")}.`,
    `Reference ids: ${ad.reference_ids.join(", ")}.`,
    input.mainImageUrl
      ? "Use the user image as the primary subject. Do not replace the subject."
      : "Create a coherent primary subject matching the brief.",
    "Do not invent business details.",
    "Do not copy any reference poster, layout, artwork, or composition from inspiration files.",
    "Use design laws only: hierarchy, contrast, alignment, proximity, repetition, balance, white space, readable CTA.",
    "If the user provided a photo, logo, or product image, it MUST remain the main subject.",
    "Prioritize readability over visual effects.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function scoreQuality(input: CreateBriefInput, prompt: string) {
  const contentScore = [
    input.title,
    input.objective,
    input.domain,
    input.format,
  ].filter(Boolean).length >= 4
    ? 85
    : 60;

  const readabilityScore = prompt.includes("Prioritize readability") ? 90 : 70;
  const compositionScore = prompt.includes("Visual hierarchy") ? 88 : 65;
  const imageScore = input.mainImageUrl ? 90 : 75;
  const designScore = Math.round((readabilityScore + compositionScore) / 2);
  const formatScore = input.format ? 90 : 70;
  const brandScore = input.colors.length <= 3 ? 85 : 70;
  const overallScore = Math.round(
    (contentScore +
      designScore +
      readabilityScore +
      compositionScore +
      imageScore +
      brandScore +
      formatScore) /
      7,
  );

  return {
    content_score: contentScore,
    design_score: designScore,
    readability_score: readabilityScore,
    composition_score: compositionScore,
    image_score: imageScore,
    brand_score: brandScore,
    format_score: formatScore,
    overall_score: overallScore,
  };
}
