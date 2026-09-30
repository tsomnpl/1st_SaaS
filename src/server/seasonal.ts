import { DOMAINS } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SEASONAL_CAMPAIGNS,
  campaignIsOpen,
  seasonalChoiceNote,
  type CampaignClock,
  type SeasonalMarket,
} from "@/lib/seasonal";
import { writeAdminLog } from "@/server/admin-audit";

export async function ensureSeasonalCampaigns() {
  for (const item of DEFAULT_SEASONAL_CAMPAIGNS) {
    const existing = await prisma.seasonalCampaign.findUnique({ where: { slug: item.slug }, select: { id: true } });
    if (existing) continue;
    await prisma.seasonalCampaign.create({
      data: {
        slug: item.slug,
        name: item.name,
        startDate: item.startDate,
        endDate: item.endDate,
        markets: item.markets,
        domains: item.domains,
        styleProfile: item.styleProfile,
        referenceIds: item.referenceIds,
        active: item.active,
        priority: item.priority,
        movable: item.movable,
      },
    });
  }
}

export async function listCampaignClocks(): Promise<CampaignClock[]> {
  await ensureSeasonalCampaigns();
  const rows = await prisma.seasonalCampaign.findMany();
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    markets: row.markets,
    domains: row.domains,
    styleProfile: row.styleProfile,
    referenceIds: row.referenceIds,
    active: row.active,
    priority: row.priority,
  }));
}

export async function resolveSeasonalForBrief(input: {
  domain: string;
  market?: string | null;
  slug?: string | null;
  decline?: boolean;
  availableReferenceIds: string[];
  now?: Date;
}) {
  const campaigns = await listCampaignClocks();
  return seasonalChoiceNote({
    campaigns,
    now: input.now ?? new Date(),
    market: input.market,
    domain: input.domain,
    slug: input.slug,
    decline: input.decline,
    availableReferenceIds: input.availableReferenceIds,
  });
}

export async function listOpenSeasonalOffers(now = new Date()) {
  const campaigns = await listCampaignClocks();
  return campaigns
    .filter((campaign) => campaignIsOpen(campaign, now))
    .sort((left, right) => right.priority - left.priority)
    .map((campaign) => ({
      slug: campaign.slug,
      name: campaign.name,
      markets: campaign.markets,
      domains: campaign.domains,
      priority: campaign.priority,
    }));
}

function parseDay(value: string | null | undefined, edge: "start" | "end") {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}Z`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE");
  return date;
}

export async function updateSeasonalCampaign(
  adminUserId: string,
  input: {
    id: string;
    active?: boolean;
    priority?: number;
    startDate?: string | null;
    endDate?: string | null;
    markets?: SeasonalMarket[];
    domains?: string[];
    referenceIds?: string[];
  },
) {
  const before = await prisma.seasonalCampaign.findUnique({ where: { id: input.id } });
  if (!before) throw new Error("NOT_FOUND");
  const domains = input.domains?.filter((domain) => (DOMAINS as readonly string[]).includes(domain));
  const markets = input.markets?.filter((market) => market === "TG" || market === "BJ" || market === "GLOBAL");
  const updated = await prisma.seasonalCampaign.update({
    where: { id: input.id },
    data: {
      active: input.active,
      priority: input.priority,
      domains,
      markets,
      referenceIds: input.referenceIds,
      startDate: parseDay(input.startDate, "start"),
      endDate: parseDay(input.endDate, "end"),
    },
  });
  await writeAdminLog({
    adminUserId,
    action: "SEASONAL_UPDATED",
    targetType: "SEASONAL_CAMPAIGN",
    targetId: updated.id,
    metadata: {
      before: { active: before.active, priority: before.priority, markets: before.markets, domains: before.domains },
      after: { active: updated.active, priority: updated.priority, markets: updated.markets, domains: updated.domains },
    },
  });
  return updated;
}
