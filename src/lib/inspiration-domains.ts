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

const SUBJECT_DOMAIN_KEYS: Array<{ key: string; pattern: RegExp }> = [
  { key: "education", pattern: /\b(formation|formations|cours|atelier|masterclass|seminaire|webinaire|ecole|inscription|etudiants?|coaching|bootcamp|examens?)\b/ },
  { key: "emploi", pattern: /\b(recrutement|recrute|emploi|stage|job|candidature|poste)\b/ },
  { key: "musique", pattern: /\b(concert|album|showcase|single|dj|festival)\b/ },
  { key: "religion-culture", pattern: /\b(eglise|culte|priere|veillee|croisade|ministere|prophete|pasteur|adoration)\b/ },
  { key: "restauration", pattern: /\b(menu|restaurant|burger|pizza|plats?)\b/ },
  { key: "mariage", pattern: /\b(mariage|wedding|fiancailles)\b/ },
  { key: "anniversaire", pattern: /\b(anniversaire|birthday)\b/ },
  { key: "technologie", pattern: /\b(ia|intelligence artificielle|logiciel|application|saas|abonnement|gemini|chatgpt)\b/ },
];

function normalizeSubject(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Supabase folders to search: the folders the brief subject points to first, then the chosen domain. */
export function referenceDomainKeys(appDomain: string, subject: string) {
  const own = supabaseDomainFor(appDomain);
  const text = normalizeSubject(subject);
  const inferred = SUBJECT_DOMAIN_KEYS.filter((row) => row.pattern.test(text)).map((row) => row.key);
  return [...new Set([...inferred, own].filter(Boolean))];
}

export function pickIndex(seed: string, length: number) {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}
