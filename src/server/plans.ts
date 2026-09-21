import { prisma } from "@/lib/prisma";
import { OFFICIAL_PLANS } from "@/lib/plans";

function toPlanRecord(plan: (typeof OFFICIAL_PLANS)[number]) {
  return {
    code: plan.code,
    name: plan.name,
    priceFcfa: plan.priceFcfa,
    mintAmount: plan.mintAmount,
    durationDays: plan.durationDays,
    editableExport: plan.editableExport,
    sortOrder: plan.sortOrder,
    active: true,
  };
}

export async function ensureOfficialPlans() {
  await Promise.all(
    OFFICIAL_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { code: plan.code },
        create: toPlanRecord(plan),
        update: {},
      }),
    ),
  );
}
