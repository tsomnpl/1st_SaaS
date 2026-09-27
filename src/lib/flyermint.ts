import { z } from "zod";
import { ADAPTIVE_FIELDS, DOMAINS } from "@/lib/domains";
import { dnaPromptBlock, type CreativeDna } from "@/lib/creative-dna";
import {
  GLOBAL_DESIGN_PROMPT,
  REFERENCE_COMPOSITION_PROMPT,
  REFERENCE_COPY_PROMPT,
  REFERENCE_INSPIRATION_PROMPT,
  STYLE_INSPIRATION_TEXT,
} from "@/lib/design-rules";
import {
  buildLayoutPlan,
  layoutPlanLines,
  slotMapping,
  unplacedClientText,
  type ReferenceAnalysis,
} from "@/lib/reference-selection";
import { humanStagingFor } from "@/lib/human-staging";
import { selectInspirationReferences } from "@/lib/inspiration";

function isSafeImageRef(value: string) {
  if (value.startsWith("https://")) return true;
  const match = value.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) return false;
  const padding = (match[2].match(/=+$/) ?? [""])[0].length;
  const bytes = Math.floor((match[2].replace(/\s/g, "").length * 3) / 4) - padding;
  return bytes > 0 && bytes <= 2_000_000;
}

const imageRef = z.string().refine(isSafeImageRef, "INVALID_IMAGE").optional();

const optionalPhone = z
  .string()
  .optional()
  .refine((value) => !value || /^[0-9+\s().-]{6,20}$/.test(value), "INVALID_PHONE");
const optionalEmail = z
  .string()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, "INVALID_EMAIL");
const optionalText = (max: number) => z.string().max(max).optional();

export const createBriefSchema = z.object({
  visualType: z.string().min(2).max(80),
  domain: z.enum(DOMAINS),
  objective: z.string().min(2).max(240),
  targetAudience: z.string().min(2).max(240),
  title: z.string().min(2).max(120),
  subtitle: optionalText(160),
  description: optionalText(2000),
  price: optionalText(40),
  oldPrice: optionalText(40),
  newPrice: optionalText(40),
  date: optionalText(40),
  time: optionalText(40),
  location: optionalText(160),
  contactPhone: optionalPhone,
  whatsapp: optionalPhone,
  email: optionalEmail,
  cta: optionalText(80),
  style: optionalText(80),
  colors: z.array(z.string().max(40)).max(8).default([]),
  mood: optionalText(80),
  format: z.string().min(2).max(40),
  creativeFreedom: z
    .enum(["liberte_totale", "liberte_guidee", "design_tres_precis"])
    .default("liberte_guidee"),
  mainImageUrl: imageRef,
  logoUrl: imageRef,
  personalReferenceUrl: imageRef,
  referenceMode: z.enum(["exact_copy", "composition", "inspiration"]).default("exact_copy"),
  regenerateFromId: z.string().min(3).max(80).optional(),
  rememberBrand: z.boolean().optional(),
  adaptiveData: z.record(z.string(), z.string().max(400)).default({}),
});

export type CreateBriefInput = z.infer<typeof createBriefSchema>;

export type ArtDirection = {
  concept: string;
  main_subject: string;
  human: {
    role: string;
    action: string;
    framing: string;
    wardrobe: string;
    expression: string;
    why: string;
  };
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
  photography: string;
  mood: string;
  negative_space: string;
  cta: string;
  format: string;
  format_variants: string[];
  reference_principles: string[];
  reference_ids: string[];
  visual_reference_ids: string[];
  visual_reference_paths: string[];
  avoid: string[];
  differentiators: string[];
};

export function buildArtDirection(input: CreateBriefInput): ArtDirection {
  const palette =
    input.colors.length > 0 ? input.colors.slice(0, 3) : ["#111827", "#20C997", "#DFFAF0"];
  const inspiration = selectInspirationReferences(input);
  const playbook = inspiration.selected[0];
  const human = humanStagingFor(input.domain);

  return {
    concept: `${input.style ?? playbook?.style ?? "moderne"} — direction artistique ${input.domain}`,
    main_subject: input.mainImageUrl ? "personne/photo fournie par le client (ne pas remplacer)" : human.role,
    human,
    secondary_elements: [input.subtitle, input.description, input.location].filter(Boolean) as string[],
    composition: playbook?.composition ?? "un heros humain, un message, un CTA",
    visual_hierarchy: [
      `Titre: ${input.title}`,
      input.price ? `Prix: ${input.price}` : "Offre principale",
      input.cta ? `CTA: ${input.cta}` : "Call to action visible",
      "Infos pratiques groupees",
    ],
    color_palette: palette,
    typography: {
      heading: "Display impact (une famille)",
      body: "Sans lisible (deuxieme famille max)",
    },
    background: playbook?.imageTreatment ?? "fond photographique coherent",
    lighting: "lumiere photographique commerciale, ombres coherentes",
    photography: "photographie publicitaire realiste, peau naturelle, mains correctes, pas de look IA",
    mood: input.mood ?? playbook?.mood ?? "professionnel",
    negative_space: "safe zone pour titre et CTA, ne pas coller les bords",
    cta: input.cta ?? "Contactez-nous",
    format: input.format,
    format_variants: [
      "instagram_post 1:1 — sujet un peu plus centre",
      "instagram_story / whatsapp_status 9:16 — sujet bas, titre haut",
      "affiche_a4 / affiche_a3 — plus de marge print, meme identite",
    ],
    reference_principles: [
      "une personne humaine obligatoire, integree, naturelle",
      "lisibilite prioritaire",
      "grille et alignements constants",
      "contraste fort texte/fond",
      "2-3 couleurs principales maximum",
      ...inspiration.principles,
    ],
    reference_ids: inspiration.selected.map((ref) => ref.id),
    visual_reference_ids: inspiration.visual.selected.map((ref) => ref.id),
    visual_reference_paths: inspiration.visual.bitmapPaths,
    avoid: [
      "zero personne humaine",
      "peau plastique, visage cireux, mains deformees",
      "texte colle aux bords ou lettres illegibles",
      "collage de 5 elements sans hierarchie",
      "copie directe d'une reference",
      "faits inventes (date, prix, tel)",
      "reprise du telephone, email, adresse ou handle de la reference",
      "affiche gradient sans photo",
      "personne genérique réutilisée d'un domaine à l'autre",
    ],
    differentiators: [
      "directeur artistique par domaine, pas un template unique",
      "personne + produit/service + message dans une seule composition",
      "identite reutilisable multi-format",
      "CTA calibre conversion (WhatsApp/telephone si fourni)",
    ],
  };
}

export type VisualLibraryApplyInput = {
  source: "supabase" | "local" | "none";
  referenceId: string;
  storagePath: string;
  dna: CreativeDna | null;
  principles: string[];
};

export function applyVisualLibrary(
  ad: ArtDirection,
  hit: VisualLibraryApplyInput,
  clientColors: string[],
): ArtDirection {
  if (hit.source === "none" && !hit.referenceId) return ad;
  const palette = clientColors.length
    ? clientColors.slice(0, 3)
    : hit.dna?.colorPalette?.length
      ? hit.dna.colorPalette.slice(0, 3)
      : ad.color_palette;
  const human = hit.dna?.humanRole
    ? {
        ...ad.human,
        role: hit.dna.humanRole,
        framing: hit.dna.humanPlacement || ad.human.framing,
      }
    : ad.human;
  return {
    ...ad,
    human,
    composition: hit.dna?.composition || ad.composition,
    background: hit.dna?.background || hit.dna?.imageTreatment || ad.background,
    mood: hit.dna?.mood || ad.mood,
    color_palette: palette,
    visual_reference_ids: hit.referenceId
      ? [hit.referenceId, ...ad.visual_reference_ids.filter((id) => id !== hit.referenceId)]
      : ad.visual_reference_ids,
    visual_reference_paths: hit.storagePath
      ? [hit.storagePath, ...ad.visual_reference_paths.filter((path) => path !== hit.storagePath)]
      : ad.visual_reference_paths,
    reference_principles: [...hit.principles, ...ad.reference_principles],
  };
}

export function buildPrompt(
  input: CreateBriefInput,
  ad: ArtDirection,
  options: {
    hasVisualReferenceImage?: boolean;
    dna?: CreativeDna | null;
    analysis?: ReferenceAnalysis | null;
    personalReference?: boolean;
  } = {},
) {
  const facts = [
    input.subtitle && `Subtitle: ${input.subtitle}`,
    input.description && `Offer copy: ${input.description}`,
    input.price && `Price (exact): ${input.price}`,
    input.oldPrice && `Old price (exact): ${input.oldPrice}`,
    input.newPrice && `New price (exact): ${input.newPrice}`,
    input.date && `Date (exact): ${input.date}`,
    input.time && `Time (exact): ${input.time}`,
    input.location && `Location (exact): ${input.location}`,
    input.contactPhone && `Phone (exact): ${input.contactPhone}`,
    input.whatsapp && `WhatsApp (exact): ${input.whatsapp}`,
    input.email && `Email (exact): ${input.email}`,
    ...adaptiveFacts(input),
  ].filter(Boolean) as string[];
  const dna = options.dna ?? null;
  const structure = dna?.layout || dna?.composition || ad.composition;

  if (options.hasVisualReferenceImage) {
    return buildReferencePrompt(input, facts, options.analysis ?? null, Boolean(options.personalReference));
  }

  return [
    "You are FlyerMint's senior art director, not a generic image generator.",
    "Pipeline: visual library → domain → style → selected reference → visual analysis → art direction → image prompt → generation → quality control.",
    STYLE_INSPIRATION_TEXT,
    GLOBAL_DESIGN_PROMPT,
    dna ? dnaPromptBlock(dna) : "",
    `1. DOMAIN: ${input.domain}. Visual type: ${input.visualType}.`,
    `2. OBJECTIVE: ${input.objective}. Audience: ${input.targetAudience}.`,
    `3. CLIENT INFORMATION (render exactly, never invent): TITLE ${input.title}. ${facts.join(" ")} CTA: ${ad.cta}.`,
    options.hasVisualReferenceImage
      ? "4. VISUAL REFERENCE: a real poster bitmap is attached. It is the composition MODEL, not a theme hint. Follow its structure."
      : "4. VISUAL REFERENCE: no bitmap attached; follow the written Creative DNA / catalog principles strictly.",
    `5. STRUCTURE TO KEEP: ${structure}. Do not invent a different grid.`,
    `6. COMPOSITION: ${dna?.composition || ad.composition}. Hierarchy: ${ad.visual_hierarchy.join(" | ")}.`,
    `7. HUMAN SUBJECT (non-negotiable): at least one photoreal person. Placement: ${dna?.humanPlacement || ad.human.framing}. Scale: ${dna?.subjectScale || "match the reference"}. Role: ${dna?.humanRole || ad.human.role}. Action: ${ad.human.action}. Wardrobe: ${ad.human.wardrobe}. Expression: ${ad.human.expression}. Why they are there: ${ad.human.why}.`,
    input.mainImageUrl
      ? "The client photo IS the human subject. Do not replace their face or body. Integrate them into the scene."
      : "Invent an original person who looks photographed, natural West/Central African or matching the stated audience. No celebrity likeness. Do not reuse the same generic face across domains.",
    input.logoUrl ? "Keep the client logo small, sharp, in a corner or badge. Do not redraw or invent another logo." : "",
    `8. PHOTOGRAPHIC STYLE: ${ad.photography}. Environment: ${ad.background}. Lighting: ${ad.lighting}. Mood: ${dna?.mood || ad.mood}. Treatment: ${dna?.imageTreatment || ad.background}.`,
    `8b. TEXT ZONES: title ${dna?.titleHierarchy || dna?.textPosition || "dominant title block from the reference"}. Price: ${dna?.pricePosition || "same zone as the reference"}. CTA: ${dna?.ctaPosition || ad.cta}.`,
    `9. TYPOGRAPHY: ${dna?.typographyHierarchy || `${ad.typography.heading} + ${ad.typography.body}`}.`,
    `10. COLORS: ${ad.color_palette.join(", ")}. If the client identity changes the accent, keep the same structure and swap only the accent.`,
    `11. CONTRAST: ${dna?.contrast || "strong text vs background, never pale type on a busy photo"}.`,
    `12. MARGINS: ${dna?.margins || "keep the same breathing rhythm as the reference"}. No important element touching the edge.`,
    `13. SAFE ZONE / WHITE SPACE: ${dna?.safeZone || dna?.whiteSpace || dna?.spacing || ad.negative_space}.`,
    `14. FORMAT: ${ad.format}. Aspect ${dna?.aspectRatio || "match requested format"}.`,
    "15. REALISM CONSTRAINTS: natural skin, real pores, correct hands, domain-specific person. No plastic AI look, no celebrity, no copied logos.",
    "16. QUALITY CONTROL: reject generic AI collages, random human placement, gradient-only posters, and any layout that does not match the reference structure.",
    input.creativeFreedom === "liberte_totale"
      ? "Creative freedom: original photography inside the SAME structure, facts exact, one photoreal human."
      : input.creativeFreedom === "design_tres_precis"
        ? "Follow the stated colors, mood and layout tightly. Do not invent a different identity."
        : "Guided freedom: strong art direction, facts locked, structure from the reference.",
    ad.visual_reference_ids.length
      ? `Visual library ids: ${ad.visual_reference_ids.join(", ")}.`
      : "",
    `Reference principles: ${ad.reference_principles.slice(0, 16).join(" || ")}.`,
    `Avoid: ${ad.avoid.join("; ")}.`,
    "Do not invent business details. If a phone, email, price or date is not in the client information, do not render one.",
    "Never copy contact details from the attached reference.",
    "If it would not be publishable by a real local business, it is a failure.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Adaptive answers with their French label, so the model never prints raw keys such as "artistes:". */
export function adaptiveFacts(input: CreateBriefInput) {
  const labels = new Map((ADAPTIVE_FIELDS[input.domain] ?? []).map((field) => [field.key, field.label]));
  return Object.entries(input.adaptiveData)
    .filter(([, value]) => value?.trim())
    .map(([key, value]) => `${labels.get(key) ?? key} (exact value, write the value only): ${value.trim()}`);
}

function withHeading(heading: string, lines: string[]) {
  return lines.length ? [heading, ...lines] : [];
}

function buildReferencePrompt(input: CreateBriefInput, facts: string[], analysis: ReferenceAnalysis | null, personal: boolean) {
  const plan = layoutPlanLines(buildLayoutPlan(input, analysis));
  const colors = input.colors.length
    ? `Client accent colors ${input.colors.slice(0, 3).join(", ")}: apply them only to the elements that carry the accent color in the reference. Do not recolor anything else.`
    : "Keep the reference colors exactly.";
  const assets = [
    personal ? "The REFERENCE POSTER is the client's own reference, for this poster only." : "",
    input.mainImageUrl ? "A CLIENT PHOTO is attached: it becomes the main subject, same position, pose, framing and light as the reference subject." : "",
    input.logoUrl ? "A CLIENT LOGO is attached: it is a brand asset. Place the exact file in the reference logo spot. Do not redraw, restyle or imitate it with text." : "",
  ];
  if (input.referenceMode === "exact_copy") {
    return [
      REFERENCE_COPY_PROMPT,
      ...plan,
      "SLOT BY SLOT (each client value goes where the equivalent information is on the reference):",
      ...slotMapping(input, analysis),
      ...withHeading(
        "Client text with no matching slot on the reference: write it in the closest equivalent spot (e.g. a CTA inside the contact band), same style as the nearby original text, without adding a new block:",
        [...unplacedClientText(input, analysis), ...(analysis?.textSlots.includes("bullets") ? [] : adaptiveFacts(input))],
      ),
      colors,
      ...assets,
      `Output format: ${input.format}.`,
      "Do not invent business details. Never keep any original text, number, date, price, name, brand or logo.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    input.referenceMode === "composition" ? REFERENCE_COMPOSITION_PROMPT : REFERENCE_INSPIRATION_PROMPT,
    ...plan,
    `Domain: ${input.domain}. Visual type: ${input.visualType}. Objective: ${input.objective}. Audience: ${input.targetAudience}.`,
    "CLIENT CONTENT (exact spelling, never invent):",
    `Title: ${input.title.trim()}`,
    ...facts,
    input.cta ? `CTA: ${input.cta.trim()}` : "",
    "Place each value in the zone that holds the equivalent information on the reference; drop zones the client gave nothing for.",
    input.style || input.mood ? `Style: ${[input.style, input.mood].filter(Boolean).join(", ")}.` : "",
    colors,
    ...assets,
    input.mainImageUrl ? "" : "Keep the same number and role of people as the reference, as new original photoreal people.",
    `Output format: ${input.format}.`,
    "Do not invent a phone, price, date, URL or address that is not in the client content.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function factsForQc(input: CreateBriefInput) {
  return [
    input.title,
    input.subtitle,
    input.description,
    input.price,
    input.oldPrice,
    input.newPrice,
    input.date,
    input.time,
    input.location,
    input.contactPhone,
    input.whatsapp,
    input.email,
    input.cta,
    ...Object.values(input.adaptiveData).filter(Boolean),
  ].filter(Boolean) as string[];
}

export function mergeRegeneratedBrief(previous: CreateBriefInput, next: CreateBriefInput): CreateBriefInput {
  return {
    ...previous,
    ...next,
    colors: next.colors.length ? next.colors : previous.colors,
    adaptiveData: { ...previous.adaptiveData, ...next.adaptiveData },
    mainImageUrl: next.mainImageUrl || previous.mainImageUrl,
    logoUrl: next.logoUrl || previous.logoUrl,
    personalReferenceUrl: next.personalReferenceUrl || previous.personalReferenceUrl,
  };
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

  const readabilityScore = /readable|spelled|lisibil/i.test(prompt) ? 90 : 70;
  const compositionScore = /hierarch/i.test(prompt) ? 88 : 65;
  const humanScore = /human subject|photoreal person/i.test(prompt) ? 92 : 50;
  const imageScore = input.mainImageUrl ? 90 : 80;
  const designScore = Math.round((readabilityScore + compositionScore) / 2);
  const formatScore = input.format ? 90 : 70;
  const brandScore = input.colors.length <= 3 ? 85 : 70;
  const overallScore = Math.round(
    (contentScore +
      designScore +
      readabilityScore +
      compositionScore +
      imageScore +
      humanScore +
      brandScore +
      formatScore) /
      8,
  );

  return {
    content_score: contentScore,
    design_score: designScore,
    readability_score: readabilityScore,
    composition_score: compositionScore,
    image_score: imageScore,
    human_score: humanScore,
    brand_score: brandScore,
    format_score: formatScore,
    overall_score: overallScore,
  };
}
