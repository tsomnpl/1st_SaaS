import { SeasonalEditor } from "@/components/admin/seasonal-editor";
import { prisma } from "@/lib/prisma";
import { ensureSeasonalCampaigns } from "@/server/seasonal";

export default async function AdminSeasonalPage() {
  await ensureSeasonalCampaigns();
  const campaigns = await prisma.seasonalCampaign.findMany({ orderBy: { priority: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Saisonnier</h1>
      <p className="text-sm text-slate-600">
        Les dates sont en Africa/Lome (UTC+0). Ramadan reste vide tant qu&apos;une date officielle n&apos;est pas saisie. Une campagne nationale ne s&apos;applique pas à un autre pays.
      </p>
      <SeasonalEditor
        campaigns={campaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          slug: campaign.slug,
          startDate: campaign.startDate ? campaign.startDate.toISOString() : null,
          endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
          markets: campaign.markets,
          domains: campaign.domains,
          referenceIds: campaign.referenceIds,
          active: campaign.active,
          priority: campaign.priority,
          movable: campaign.movable,
        }))}
      />
    </div>
  );
}
