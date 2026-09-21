import { existsSync } from "node:fs";
import path from "node:path";
import { DOMAINS, DOMAIN_LABELS, type DOMAINS as DomainTuple } from "@/lib/domains";
import { getGeneratedShowcase, toPoster } from "@/lib/showcase";
import type { ShowcaseManifestEntry } from "@/lib/showcase-manifest";

export type LandingPoster = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  cta?: string;
  imageSrc: string;
  domaine: string;
  domainKey?: (typeof DOMAINS)[number];
};

const SHEET_ID_DOMAIN: Record<string, (typeof DOMAINS)[number]> = {
  "evenementiel-01": "Evenementiel",
  "evenementiel-02": "Evenementiel",
  "evenementiel-03": "Evenementiel",
  "evenementiel-04": "Evenementiel",
  "restauration-01": "Restauration",
  "restauration-02": "Restauration",
  "restauration-03": "Restauration",
  "restauration-04": "Restauration",
  "mode-01": "Mode & Accessoires",
  "mode-02": "Mode & Accessoires",
  "mode-03": "Mode & Accessoires",
  "beaute-01": "Beaute & Soins",
  "beaute-02": "Beaute & Soins",
  "beaute-03": "Beaute & Soins",
  "immobilier-business-01": "Immobilier",
  "immobilier-business-02": "Immobilier",
  "immobilier-business-03": "Business & Entreprise",
  "immobilier-business-04": "Finance & Fintech",
  "immobilier-business-05": "E-commerce",
  "techno-education-01": "Technologie",
  "techno-education-02": "Education & Formation",
  "techno-education-03": "Education & Formation",
  "sport-finance-01": "Sport",
  "sport-finance-02": "Finance & Fintech",
  "sante-tourisme-associations-01": "Sante & Clinique",
  "sante-tourisme-associations-02": "Tourisme & Voyage",
  "sante-tourisme-associations-03": "Associations",
};

function publicImageExists(src: string) {
  if (!src.startsWith("/")) return false;
  return existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

function toLandingPoster(entry: ShowcaseManifestEntry, hero = false): LandingPoster | null {
  const mapped = toPoster(entry, hero);
  const imageSrc = mapped.imageSrc;
  if (!imageSrc || !publicImageExists(imageSrc)) return null;
  return {
    id: mapped.id,
    title: mapped.title,
    subtitle: mapped.subtitle,
    meta: mapped.meta,
    cta: mapped.cta,
    imageSrc,
    domaine: mapped.domaine,
    domainKey: SHEET_ID_DOMAIN[mapped.id],
  };
}

export async function getLandingVisuals() {
  const { generated, manifest } = await getGeneratedShowcase();
  const real = generated
    .map((entry) => toLandingPoster(entry, false))
    .filter((poster): poster is LandingPoster => Boolean(poster));
  const hero = generated
    .filter((entry) => entry.hero_loop)
    .map((entry) => toLandingPoster(entry, true))
    .filter((poster): poster is LandingPoster => Boolean(poster));

  const byDomain = new Map<(typeof DOMAINS)[number], LandingPoster>();
  for (const poster of real) {
    if (poster.domainKey && !byDomain.has(poster.domainKey)) {
      byDomain.set(poster.domainKey, poster);
    }
  }

  const domains = DOMAINS.map((domain) => ({
    domain,
    label: DOMAIN_LABELS[domain],
    poster: byDomain.get(domain) ?? null,
  }));

  const afterPoster =
    real.find((poster) => poster.domainKey === "Restauration") ?? real[0] ?? null;

  return {
    source: "docs/inspirations/showcase-manifest.json + public/creations",
    generatedCount: generated.length,
    realPosters: real,
    heroPosters: hero.length ? hero : real.slice(0, 10),
    showcase: pickDiverse(real, 12),
    domains,
    afterPoster,
    manifestCount: manifest?.count ?? 0,
  };
}

function pickDiverse(posters: LandingPoster[], limit: number) {
  const seen = new Set<string>();
  const picked: LandingPoster[] = [];
  for (const poster of posters) {
    const key = poster.domainKey ?? poster.domaine;
    if (seen.has(key) && picked.length + (posters.length - picked.length) > limit) {
      continue;
    }
    seen.add(key);
    picked.push(poster);
    if (picked.length >= limit) break;
  }
  if (picked.length < Math.min(limit, posters.length)) {
    for (const poster of posters) {
      if (picked.some((item) => item.id === poster.id)) continue;
      picked.push(poster);
      if (picked.length >= limit) break;
    }
  }
  return picked;
}

export async function getLandingVisualsSafe() {
  try {
    const data = await getLandingVisuals();
    return { ...data, error: null as string | null };
  } catch {
    return {
      source: "",
      generatedCount: 0,
      realPosters: [] as LandingPoster[],
      heroPosters: [] as LandingPoster[],
      showcase: [] as LandingPoster[],
      domains: DOMAINS.map((domain) => ({
        domain,
        label: DOMAIN_LABELS[domain],
        poster: null,
      })),
      afterPoster: null,
      manifestCount: 0,
      error: "Impossible de charger les créations.",
    };
  }
}

export type { DomainTuple };
