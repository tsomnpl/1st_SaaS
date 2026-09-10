import { prisma } from "@/lib/prisma";
import { PaymentButton } from "@/components/payment-button";
import { ensureOfficialPlans } from "@/server/plans";

export default async function PricingPage() {
  await ensureOfficialPlans();
  const plans = await prisma.plan.findMany({
    where: { active: true, priceFcfa: { gt: 0 } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#20C997]">Offres</p>
        <h1 className="mt-2 text-4xl font-semibold">Choisis tes Mints</h1>
        <p className="mt-3 max-w-2xl text-white/75">
          1 Mint = 1 affiche. L&apos;export ne consomme aucun Mint. Le pack 2 000 FCFA expire au bout de 30 jours ;
          les autres packs n&apos;expirent pas.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="flex flex-col rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
            <p className="mt-3 text-3xl font-semibold text-[#20C997]">
              {plan.priceFcfa.toLocaleString("fr-FR")} FCFA
            </p>
            <p className="mt-2 text-sm text-white/80">
              {plan.mintAmount} Mints = {plan.mintAmount} affiches
            </p>
            <p className="text-sm text-white/65">
              {plan.durationDays ? `Valables ${plan.durationDays} jours` : "Sans expiration"}
            </p>
            {plan.editableExport ? (
              <p className="mt-2 text-sm text-white/70">Export avance inclus</p>
            ) : null}
            <div className="mt-5">
              <PaymentButton planCode={plan.code} label="Acheter" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
