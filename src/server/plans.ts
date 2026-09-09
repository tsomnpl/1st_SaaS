import { prisma } from "@/lib/prisma";
import { OFFICIAL_PLANS } from "@/lib/plans";

export async function ensureOfficialPlans() {
  await Promise.all(
    OFFICIAL_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { code: plan.code },
        create: {
          ...plan,
          active: true,
        },
        update: {
          name: plan.name,
          priceFcfa: plan.priceFcfa,
          mintAmount: plan.mintAmount,
          durationDays: plan.durationDays,
          editableExport: plan.editableExport,
          sortOrder: plan.sortOrder,
        },
      }),
    ),
  );
}
