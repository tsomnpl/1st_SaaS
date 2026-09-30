import type { Metadata } from "next";
import { pageTitle } from "@/lib/seo";
import { PricingGrid } from "@/components/pricing/pricing-grid";
import { PromoBox } from "@/components/pricing/promo-box";
import { getDictionary } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: pageTitle(t.nav.pricing),
    description: t.pricing.lead,
    openGraph: {
      title: `${t.nav.pricing}, FlyerMint`,
      description: t.pricing.equals,
    },
  };
}
import { prisma } from "@/lib/prisma";
import { isLaunchOfferOpen, LAUNCH_OFFER_CODE, OFFICIAL_PLANS, paidPlans, visiblePaidPlans } from "@/lib/plans";
import { ensureOfficialPlans } from "@/server/plans";

export default async function PricingPage() {
  const { t } = await getDictionary();
  const plans = await loadPlans();

  return (
    <div className="space-y-10 pb-10">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">{t.pricing.kicker}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1E293B]">{t.pricing.title}</h1>
        <p className="mt-3 text-slate-600">{t.pricing.lead}</p>
      </section>
      <PricingGrid plans={plans} />
      <PromoBox />
    </div>
  );
}

async function loadPlans() {
  try {
    await ensureOfficialPlans();
    const rows = await prisma.plan.findMany({
      where: { active: true, priceFcfa: { gt: 0 } },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length > 0) {
      return rows
        .map((row) => {
          const seed = OFFICIAL_PLANS.find((plan) => plan.code === row.code);
          return {
            ...(seed ?? paidPlans()[0]),
            code: row.code,
            name: row.name,
            priceFcfa: row.priceFcfa,
            mintAmount: row.mintAmount,
            durationDays: row.durationDays,
            editableExport: row.editableExport,
          };
        })
        .filter((plan) => plan.code !== LAUNCH_OFFER_CODE || isLaunchOfferOpen());
    }
  } catch {
    // Affiche les offres même si la base est indisponible.
  }
  return visiblePaidPlans();
}
