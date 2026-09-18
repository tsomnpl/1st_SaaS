import { prisma } from "@/lib/prisma";
import { ensureOfficialPlans } from "@/server/plans";

export default async function AdminPlansPage() {
  await ensureOfficialPlans();
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Plans</h1>
      {plans.map((plan) => (
        <article key={plan.id} className="card p-4 text-sm">
          <p className="font-semibold">{plan.name}</p>
          <p className="text-slate-500">
            {plan.priceFcfa.toLocaleString("fr-FR")} FCFA · {plan.mintAmount} Mints ·{" "}
            {plan.durationDays ? `${plan.durationDays} jours` : "sans expiration"}
            {plan.editableExport ? " · export éditable" : ""}
          </p>
        </article>
      ))}
    </div>
  );
}
