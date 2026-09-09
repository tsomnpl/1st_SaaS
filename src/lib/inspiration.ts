import { CreateBriefInput } from "@/lib/flyermint";

export type InspirationReference = {
  id: string;
  domain: string;
  style: string;
  composition: string;
  colorPalette: string;
  typography: string;
  imageTreatment: string;
  layout: string;
  density: string;
  mood: string;
  tags: string[];
};

export const INSPIRATION_LIBRARY: InspirationReference[] = [
  {
    id: "evt-premium-grid",
    domain: "Evenementiel",
    style: "premium",
    composition: "hero visuel + bloc infos date/lieu",
    colorPalette: "contrast dark + accent mint",
    typography: "sans bold heading + clean body",
    imageTreatment: "high contrast with spotlight",
    layout: "grid asymetrique",
    density: "medium",
    mood: "energetique",
    tags: ["concert", "event", "night", "cta"],
  },
  {
    id: "food-clean-focus",
    domain: "Restauration",
    style: "moderne",
    composition: "plat hero centré + prix fort",
    colorPalette: "warm accent + neutral background",
    typography: "friendly sans with strong numerals",
    imageTreatment: "close-up appetissant",
    layout: "simple vertical hierarchy",
    density: "low",
    mood: "chaleureux",
    tags: ["menu", "promo", "delivery"],
  },
  {
    id: "real-estate-trust",
    domain: "Immobilier",
    style: "corporate",
    composition: "batiment principal + specs cards",
    colorPalette: "blue/gray trust palette",
    typography: "geometric sans",
    imageTreatment: "wide-angle corrected",
    layout: "two-column",
    density: "medium",
    mood: "professionnel",
    tags: ["villa", "location", "surface", "price"],
  },
  {
    id: "auto-performance",
    domain: "Automobile",
    style: "dynamique",
    composition: "car 3/4 view + financing CTA",
    colorPalette: "dark metallic + accent color",
    typography: "bold condensed heading",
    imageTreatment: "reflective highlight",
    layout: "diagonal energy",
    density: "medium",
    mood: "puissant",
    tags: ["brand", "model", "year", "deal"],
  },
  {
    id: "education-enrollment",
    domain: "Education & Formation",
    style: "professionnel",
    composition: "instructor/product hero + bullet benefits",
    colorPalette: "academic blue + mint accent",
    typography: "clean readable sans",
    imageTreatment: "natural portrait",
    layout: "structured sections",
    density: "medium",
    mood: "motivant",
    tags: ["formation", "certificat", "inscription"],
  },
  {
    id: "fashion-minimal-lux",
    domain: "Mode & Accessoires",
    style: "luxueux",
    composition: "single hero subject + minimal text",
    colorPalette: "neutral + gold accent",
    typography: "editorial serif + sans mix",
    imageTreatment: "studio clean lighting",
    layout: "large negative space",
    density: "low",
    mood: "elegant",
    tags: ["new collection", "brand", "premium"],
  },
];

export function selectInspirationReferences(input: CreateBriefInput) {
  const domainMatches = INSPIRATION_LIBRARY.filter((ref) => ref.domain === input.domain);
  const styleKeyword = (input.style ?? "").toLowerCase();
  const moodKeyword = (input.mood ?? "").toLowerCase();

  const scored = domainMatches
    .map((ref) => {
      let score = 0;
      if (styleKeyword && ref.style.toLowerCase().includes(styleKeyword)) score += 2;
      if (moodKeyword && ref.mood.toLowerCase().includes(moodKeyword)) score += 2;
      if (input.objective.toLowerCase().includes("vendre")) score += ref.tags.includes("promo") ? 2 : 1;
      if (input.mainImageUrl) score += ref.imageTreatment.includes("hero") ? 1 : 0;
      return { ref, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected = (scored.length ? scored : domainMatches.map((ref) => ({ ref, score: 0 })))
    .slice(0, 3)
    .map(({ ref }) => ref);

  return {
    selected,
    principles: selected.map((ref) => `${ref.composition} | ${ref.layout} | ${ref.typography}`),
  };
}
