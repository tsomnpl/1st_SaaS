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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Offres FlyerMint</h1>
      <p className="text-white/80">1 Mint = 1 affiche. Export standard gratuit (0 Mint).</p>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="card p-5">
            <h2 className="text-lg font-semibold text-emerald-300">{plan.name}</h2>
            <p className="mt-2 text-sm">{plan.priceFcfa.toLocaleString("fr-FR")} FCFA</p>
            <p className="text-sm">{plan.mintAmount} Mints = {plan.mintAmount} affiches</p>
            <p className="text-sm">
              Expiration: {plan.durationDays ? `${plan.durationDays} jours` : "Jamais"}
            </p>
            <p className="text-sm">
              Export editable: {plan.editableExport ? "Oui (format intermédiaire reconstructible)" : "Non"}
            </p>
            <div className="mt-4">
              <PaymentButton planCode={plan.code} label="Acheter" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
