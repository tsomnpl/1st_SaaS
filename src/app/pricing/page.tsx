import type { Metadata } from "next";
import { pageTitle } from "@/lib/seo";
import { PricingGrid } from "@/components/pricing/pricing-grid";

export const metadata: Metadata = {
  title: pageTitle("Tarifs"),
  description: "Packs de Mints FlyerMint. 1 Mint = 1 affiche. Sans fausse réduction.",
  openGraph: {
    title: "Tarifs — FlyerMint",
    description: "Packs de Mints FlyerMint. 1 Mint = 1 affiche.",
  },
};
import { prisma } from "@/lib/prisma";
import { OFFICIAL_PLANS, paidPlans } from "@/lib/plans";
import { ensureOfficialPlans } from "@/server/plans";

export default async function PricingPage() {
  const plans = await loadPlans();

  return (
    <div className="page-canvas space-y-10 pb-10">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Offres</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-night">
          Choisis tes Mints
        </h1>
        <p className="mt-3 text-slate-600">
          1 Mint = 1 affiche. L’export ne consomme aucun Mint. Le pack Starter expire au bout de
          30 jours ; les autres packs n’expirent pas.
        </p>
      </section>
      <PricingGrid plans={plans} />
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
      return rows.map((row) => {
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
      });
    }
  } catch {
    // Affiche les offres même si la base est indisponible.
  }
  return paidPlans();
}
