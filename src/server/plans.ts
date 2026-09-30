import { prisma } from "@/lib/prisma";
import { LAUNCH_OFFER_CODE, OFFICIAL_PLANS, paidPlans, visiblePaidPlans, type PlanSeed } from "@/lib/plans";
import { isStarterOfferLive } from "@/lib/starter-offer";

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
        update: { durationDays: plan.durationDays },
      }),
    ),
  );
}

export async function closeExpiredStarterOffer(now = new Date()) {
  await prisma.plan.updateMany({
    where: { code: LAUNCH_OFFER_CODE, active: true, offerEndsAt: { lte: now } },
    data: { active: false },
  });
}

export async function loadSellablePlans(now = new Date()): Promise<PlanSeed[]> {
  try {
    await ensureOfficialPlans();
    await closeExpiredStarterOffer(now);
    const rows = await prisma.plan.findMany({
      where: { priceFcfa: { gt: 0 } },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) return visiblePaidPlans(now);
    return rows
      .filter((row) => row.active && (row.code !== LAUNCH_OFFER_CODE || isStarterOfferLive(row, now)))
      .map((row) => {
        const seed = OFFICIAL_PLANS.find((plan) => plan.code === row.code) ?? paidPlans()[0];
        const liveStarter = row.code === LAUNCH_OFFER_CODE;
        return {
          ...seed,
          code: row.code,
          name: row.name,
          priceFcfa: row.priceFcfa,
          mintAmount: row.mintAmount,
          durationDays: row.durationDays,
          editableExport: row.editableExport,
          bestSeller: liveStarter,
          offerEndsAt: liveStarter && row.offerEndsAt ? row.offerEndsAt.toISOString() : null,
          offerDays: liveStarter ? row.offerDays : null,
        };
      });
  } catch {
    return visiblePaidPlans(now);
  }
}
