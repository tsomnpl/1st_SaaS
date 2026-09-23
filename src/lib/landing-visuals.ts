import { existsSync } from "node:fs";
import path from "node:path";
import { DOMAINS, DOMAIN_LABELS, type DOMAINS as DomainTuple } from "@/lib/domains";
import {
  AFTER_POSTER_FALLBACK_ID,
  AFTER_POSTER_ID,
  CREATIONS_PINNED_IDS,
  HERO_POSTER_IDS,
  LANDING_SHOWCASE_IDS,
  PINNED_BURGER_POSTER,
} from "@/lib/landing-posters";
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
  "mariage-01": "Mariage",
  "anniversaire-01": "Anniversaire",
  "emploi-01": "Emploi & Recrutement",
  "agriculture-01": "Agriculture",
  "automobile-01": "Automobile",
  "musique-01": "Musique",
  "culture-01": "Religion & Culture",
  "services-01": "Services divers",
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
  const burger = pinnedBurgerPoster();
  if (burger && !real.some((poster) => poster.id === burger.id)) {
    real.unshift(burger);
  }
  const pinnedIds = new Set<string>(CREATIONS_PINNED_IDS);
  const pinned = pickByIds(real, CREATIONS_PINNED_IDS);
  const rest = real.filter((poster) => !pinnedIds.has(poster.id));
  real.splice(0, real.length, ...pinned, ...rest);

  const hero = pickByIds(
    generated
      .map((entry) => toLandingPoster(entry, true))
      .filter((poster): poster is LandingPoster => Boolean(poster)),
    HERO_POSTER_IDS,
  );

  const byDomain = new Map<(typeof DOMAINS)[number], LandingPoster>();
  for (const poster of real) {
    if (poster.domainKey && !byDomain.has(poster.domainKey)) {
      byDomain.set(poster.domainKey, poster);
    }
  }

  const domains = DOMAINS.map((domain) => {
    const poster = byDomain.get(domain);
    if (!poster) return null;
    return { domain, label: DOMAIN_LABELS[domain], poster };
  }).filter((item): item is { domain: (typeof DOMAINS)[number]; label: string; poster: LandingPoster } =>
    Boolean(item),
  );

  const afterPoster =
    real.find((poster) => poster.id === AFTER_POSTER_ID) ??
    real.find((poster) => poster.id === AFTER_POSTER_FALLBACK_ID) ??
    null;

  return {
    source: "docs/inspirations/showcase-manifest.json + public/creations",
    generatedCount: generated.length,
    realPosters: real,
    heroPosters: hero.length ? hero : pickByIds(real, HERO_POSTER_IDS),
    showcase: pickByIds(real, LANDING_SHOWCASE_IDS),
    domains,
    afterPoster,
    manifestCount: manifest?.count ?? 0,
  };
}

function pinnedBurgerPoster(): LandingPoster | null {
  if (!publicImageExists(PINNED_BURGER_POSTER.imageSrc)) return null;
  return { ...PINNED_BURGER_POSTER };
}

function pickByIds(posters: LandingPoster[], ids: readonly string[]) {
  const byId = new Map(posters.map((poster) => [poster.id, poster]));
  return ids.map((id) => byId.get(id)).filter((poster): poster is LandingPoster => Boolean(poster));
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
      domains: [] as Array<{
        domain: (typeof DOMAINS)[number];
        label: string;
        poster: LandingPoster;
      }>,
      afterPoster: null,
      manifestCount: 0,
      error: "Impossible de charger les créations.",
    };
  }
}

export type { DomainTuple };
