import { DOMAINS } from "@/lib/domains";

export type AppDomain = (typeof DOMAINS)[number];

/** Supabase `inspiration_source.domaine` keys (private bucket inspirations-source). */
export const SUPABASE_DOMAIN_BY_APP: Record<AppDomain, string> = {
  Evenementiel: "evenementiel",
  Restauration: "restauration",
  "Mode & Accessoires": "mode",
  "Beaute & Soins": "beaute",
  Immobilier: "immobilier",
  "Business & Entreprise": "business",
  Technologie: "technologie",
  "Education & Formation": "education",
  Sport: "sport",
  "Finance & Fintech": "finance",
  "Sante & Clinique": "sante",
  "Tourisme & Voyage": "tourisme",
  "E-commerce": "e-commerce",
  Mariage: "mariage",
  Anniversaire: "anniversaire",
  "Emploi & Recrutement": "emploi",
  Agriculture: "agriculture",
  Automobile: "automobile",
  Musique: "musique",
  Associations: "associations",
  "Religion & Culture": "religion-culture",
  "Services divers": "services",
};

export function supabaseDomainFor(appDomain: string) {
  return SUPABASE_DOMAIN_BY_APP[appDomain as AppDomain] ?? "";
}

export function pickIndex(seed: string, length: number) {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}
