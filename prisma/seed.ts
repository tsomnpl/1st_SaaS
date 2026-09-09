import { PrismaClient } from "@prisma/client";
import { OFFICIAL_PLANS } from "../src/lib/plans";

const prisma = new PrismaClient();

async function main() {
  for (const plan of OFFICIAL_PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: {
        name: plan.name,
        priceFcfa: plan.priceFcfa,
        mintAmount: plan.mintAmount,
        durationDays: plan.durationDays,
        editableExport: plan.editableExport,
        sortOrder: plan.sortOrder,
        active: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
