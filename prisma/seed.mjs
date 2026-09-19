import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  ["FREE", "Gratuit", 0, 1, null, false, 0],
  ["STARTER_2K", "Pack Starter", 2000, 2, 30, false, 1],
  ["PACK_5K", "Pack Essentiel", 5000, 2, null, false, 2],
  ["PACK_10K", "Pack Campagne", 10000, 5, null, false, 3],
  ["PACK_15K", "Pack Studio", 15000, 10, null, false, 4],
  ["PACK_20K", "Pack Pro", 20000, 15, null, true, 5],
  ["PACK_25K", "Pack Atelier", 25000, 20, null, true, 6],
];

async function seedShowcaseReferences() {
  try {
    const file = path.join(process.cwd(), "docs/inspirations/references-catalog.json");
    const catalog = JSON.parse(await readFile(file, "utf8")) as {
      items?: Array<{
        id: string;
        domaine: string;
        style: string;
        composition: string;
        palette: string[];
        ambiance: string;
        imageUrl?: string;
      }>;
    };
    for (const item of catalog.items ?? []) {
      await prisma.reference.upsert({
        where: { id: `showcase-${item.id}` },
        create: {
          id: `showcase-${item.id}`,
          domain: item.domaine,
          style: item.style,
          composition: item.composition,
          colorPalette: item.palette.join(", "),
          mood: item.ambiance,
          imageUrl: item.imageUrl,
          tags: ["showcase", "style-only"],
        },
        update: {
          domain: item.domaine,
          style: item.style,
          composition: item.composition,
          colorPalette: item.palette.join(", "),
          mood: item.ambiance,
          imageUrl: item.imageUrl,
        },
      });
    }
  } catch {
    // catalog or database optional during local seed
  }
}

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
  await seedShowcaseReferences();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
