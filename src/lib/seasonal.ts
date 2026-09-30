/**
 * Seasonal windows are admin-editable rows, not dates buried in components.
 * Africa/Lome is UTC+0, so a calendar date stored as 00:00Z is that civil day in Lome.
 * Ramadan follows a lunar calendar. Its dates stay empty until an admin sets them.
 * A campaign never applies to a country that is not in its markets.
 * An unknown market matches GLOBAL only.
 */

export type SeasonalMarket = "TG" | "BJ" | "GLOBAL";

export type StyleProfile = {
  campaign: string;
  mood: string;
  typography: string;
  composition: string;
  visualElements: string[];
  forbiddenElements: string[];
};

export type SeasonalCampaignInput = {
  slug: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  markets: SeasonalMarket[];
  domains: string[];
  styleProfile: StyleProfile;
  referenceIds: string[];
  active: boolean;
  priority: number;
  movable: boolean;
};

export type SeasonalArtNote = {
  accepted: boolean;
  slug: string | null;
  name: string | null;
  styleProfile: StyleProfile | null;
  usedReferenceIds: string[];
  missingReferenceIds: string[];
};

const backToSchool: StyleProfile = {
  campaign: "rentree-scolaire",
  mood: "rentree claire, energie de campus",
  typography: "titre lisible, date bien espacee",
  composition: "garder la grille du domaine, accent cahier discret",
  visualElements: ["cahier", "cartable", "crayon"],
  forbiddenElements: ["neige", "ramadan", "drapeau d'un pays non cible"],
};

const yearEnd: StyleProfile = {
  campaign: "fetes-fin-annee",
  mood: "fete chaude, table et lumieres",
  typography: "titre festif mais lisible",
  composition: "garder la grille du domaine, accent lumineux discret",
  visualElements: ["lumieres chaudes", "table de fete"],
  forbiddenElements: ["rentree scolaire", "ramadan"],
};

const ramadan: StyleProfile = {
  campaign: "ramadan",
  mood: "nuit calme, partage, lumiere doree",
  typography: "titre lisible, pas d'ornement qui gene le texte",
  composition: "garder la grille du domaine, accent lanterne discret",
  visualElements: ["lanterne", "croissant", "table de rupture"],
  forbiddenElements: ["alcool", "porc", "noel"],
};

const togo: StyleProfile = {
  campaign: "fete-nationale-togo",
  mood: "fete civile togolaise",
  typography: "titre lisible",
  composition: "garder la grille du domaine",
  visualElements: ["vert", "jaune", "rouge", "etoile blanche"],
  forbiddenElements: ["drapeau du Benin"],
};

const benin: StyleProfile = {
  campaign: "fete-nationale-benin",
  mood: "fete civile beninoise",
  typography: "titre lisible",
  composition: "garder la grille du domaine",
  visualElements: ["vert", "jaune", "rouge"],
  forbiddenElements: ["drapeau du Togo"],
};

export const DEFAULT_SEASONAL_CAMPAIGNS: SeasonalCampaignInput[] = [
  {
    slug: "rentree-scolaire",
    name: "Rentrée scolaire",
    startDate: new Date("2026-09-01T00:00:00.000Z"),
    endDate: new Date("2026-10-15T23:59:59.999Z"),
    markets: ["GLOBAL"],
    domains: ["Education & Formation", "Mode & Accessoires", "Restauration"],
    styleProfile: backToSchool,
    referenceIds: [],
    active: true,
    priority: 40,
    movable: false,
  },
  {
    slug: "fetes-fin-annee",
    name: "Fêtes de fin d'année",
    startDate: new Date("2026-12-01T00:00:00.000Z"),
    endDate: new Date("2027-01-02T23:59:59.999Z"),
    markets: ["GLOBAL"],
    domains: ["Evenementiel", "Restauration", "Mode & Accessoires", "E-commerce", "Religion & Culture"],
    styleProfile: yearEnd,
    referenceIds: [],
    active: true,
    priority: 30,
    movable: false,
  },
  {
    slug: "ramadan",
    name: "Ramadan",
    startDate: null,
    endDate: null,
    markets: ["GLOBAL"],
    domains: ["Restauration", "Mode & Accessoires", "Religion & Culture", "Evenementiel"],
    styleProfile: ramadan,
    referenceIds: [],
    active: false,
    priority: 20,
    movable: true,
  },
  {
    slug: "fete-nationale-togo",
    name: "Fête nationale du Togo",
    startDate: new Date("2026-04-27T00:00:00.000Z"),
    endDate: new Date("2026-04-27T23:59:59.999Z"),
    markets: ["TG"],
    domains: ["Evenementiel", "Associations", "Restauration", "Mode & Accessoires"],
    styleProfile: togo,
    referenceIds: [],
    active: true,
    priority: 10,
    movable: false,
  },
  {
    slug: "fete-nationale-benin",
    name: "Fête nationale du Bénin",
    startDate: new Date("2026-08-01T00:00:00.000Z"),
    endDate: new Date("2026-08-01T23:59:59.999Z"),
    markets: ["BJ"],
    domains: ["Evenementiel", "Associations", "Restauration", "Mode & Accessoires"],
    styleProfile: benin,
    referenceIds: [],
    active: true,
    priority: 10,
    movable: false,
  },
];

export type CampaignClock = {
  slug: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  markets: string[];
  domains: string[];
  styleProfile: unknown;
  referenceIds: string[];
  active: boolean;
  priority: number;
};

export function campaignIsOpen(campaign: Pick<CampaignClock, "active" | "startDate" | "endDate">, now: Date) {
  if (!campaign.active || !campaign.startDate || !campaign.endDate) return false;
  return now.getTime() >= campaign.startDate.getTime() && now.getTime() <= campaign.endDate.getTime();
}

export function campaignMatchesMarket(markets: string[], market?: string | null) {
  if (markets.includes("GLOBAL")) return true;
  if (!market) return false;
  return markets.includes(market);
}

export function campaignMatchesDomain(domains: string[], domain: string) {
  return domains.includes(domain);
}

export function campaignIsEligible(
  campaign: CampaignClock,
  input: { now: Date; market?: string | null; domain: string },
) {
  return (
    campaignIsOpen(campaign, input.now) &&
    campaignMatchesMarket(campaign.markets, input.market) &&
    campaignMatchesDomain(campaign.domains, input.domain)
  );
}

export function pickSeasonalCampaign(campaigns: CampaignClock[], input: { now: Date; market?: string | null; domain: string }) {
  return campaigns
    .filter((campaign) => campaignIsEligible(campaign, input))
    .sort((a, b) => b.priority - a.priority)[0] ?? null;
}

export function splitReferenceIds(pinned: string[], availableIds: string[]) {
  const available = new Set(availableIds);
  return {
    usedReferenceIds: pinned.filter((id) => available.has(id)),
    missingReferenceIds: pinned.filter((id) => !available.has(id)),
  };
}

export function readStyleProfile(value: unknown, slug: string): StyleProfile | null {
  if (!value || typeof value !== "object") return null;
  const profile = value as Partial<StyleProfile>;
  if (!profile.mood || !profile.typography || !profile.composition) return null;
  return {
    campaign: profile.campaign || slug,
    mood: String(profile.mood),
    typography: String(profile.typography),
    composition: String(profile.composition),
    visualElements: Array.isArray(profile.visualElements) ? profile.visualElements.map(String) : [],
    forbiddenElements: Array.isArray(profile.forbiddenElements) ? profile.forbiddenElements.map(String) : [],
  };
}

export function seasonalChoiceNote(input: {
  campaigns: CampaignClock[];
  now: Date;
  market?: string | null;
  domain: string;
  slug?: string | null;
  decline?: boolean;
  availableReferenceIds: string[];
}): SeasonalArtNote | null {
  const eligible = pickSeasonalCampaign(input.campaigns, input);
  if (!eligible) return null;
  const accepted = !input.decline && Boolean(input.slug) && input.slug === eligible.slug;
  if (!accepted) {
    return {
      accepted: false,
      slug: eligible.slug,
      name: eligible.name,
      styleProfile: null,
      usedReferenceIds: [],
      missingReferenceIds: [],
    };
  }
  const pinned = splitReferenceIds(eligible.referenceIds, input.availableReferenceIds);
  return {
    accepted: true,
    slug: eligible.slug,
    name: eligible.name,
    styleProfile: readStyleProfile(eligible.styleProfile, eligible.slug),
    usedReferenceIds: pinned.usedReferenceIds,
    missingReferenceIds: pinned.missingReferenceIds,
  };
}

export function seasonalPromptBlock(note: SeasonalArtNote | null) {
  if (!note?.accepted || !note.styleProfile) return "";
  const style = note.styleProfile;
  return [
    `SEASONAL CAMPAIGN ${note.slug}. Optional accent only. Do not replace the client facts and do not switch domain.`,
    `Mood: ${style.mood}. Typography: ${style.typography}. Composition note: ${style.composition}.`,
    `Visual accents: ${style.visualElements.join(", ") || "none"}.`,
    `Forbidden: ${style.forbiddenElements.join(", ") || "none"}.`,
    "On an exact copy, add the accent only inside a free zone. Do not build a new grid.",
  ].join(" ");
}
