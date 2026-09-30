import { prisma } from "@/lib/prisma";
import { closeExpiredStarterOffer, ensureOfficialPlans } from "@/server/plans";
import { AdminPlansClient } from "@/components/admin/admin-plans-client";

export default async function AdminPlansPage() {
  await ensureOfficialPlans();
  await closeExpiredStarterOffer();
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Plans</h1>
      <p className="text-sm text-slate-500">Toute modification importante demande une confirmation.</p>
      <AdminPlansClient
        plans={plans.map((plan) => ({
          id: plan.id,
          code: plan.code,
          name: plan.name,
          priceFcfa: plan.priceFcfa,
          mintAmount: plan.mintAmount,
          durationDays: plan.durationDays,
          editableExport: plan.editableExport,
          active: plan.active,
          offerDays: plan.offerDays,
          offerEndsAt: plan.offerEndsAt ? plan.offerEndsAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
