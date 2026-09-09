import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  ["FREE", "Gratuit", 0, 1, null, false, 0],
  ["STARTER_2K", "Pack Starter 2 000 FCFA", 2000, 2, 30, false, 1],
  ["PACK_5K", "Pack 5 000 FCFA", 5000, 2, null, false, 2],
  ["PACK_10K", "Pack 10 000 FCFA", 10000, 5, null, false, 3],
  ["PACK_15K", "Pack 15 000 FCFA", 15000, 10, null, false, 4],
  ["PACK_20K", "Pack 20 000 FCFA", 20000, 15, null, true, 5],
  ["PACK_25K", "Pack 25 000 FCFA", 25000, 20, null, true, 6],
];

async function main() {
  for (const [code, name, priceFcfa, mintAmount, durationDays, editableExport, sortOrder] of plans) {
    await prisma.plan.upsert({
      where: { code },
      create: {
        code,
        name,
        priceFcfa,
        mintAmount,
        durationDays,
        editableExport,
        sortOrder,
        active: true,
      },
      update: {
        name,
        priceFcfa,
        mintAmount,
        durationDays,
        editableExport,
        sortOrder,
        active: true,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
