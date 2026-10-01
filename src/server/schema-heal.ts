import { prisma } from "@/lib/prisma";

export function isMissingColumn(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "P2021" || code === "P2022") return true;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /does not exist|n'existe pas/i.test(message);
}

const statements = [
  `
    DO $$ BEGIN
      CREATE TYPE "GenerationVariant" AS ENUM ('A', 'B');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode")`,
  `ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "groupId" TEXT`,
  `ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "variant" "GenerationVariant"`,
];

let pending: Promise<void> | null = null;

async function applyAccountColumns() {
  const failures: unknown[] = [];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (error) {
      failures.push(error);
      console.error("schema-heal", error instanceof Error ? error.message : error);
    }
  }
  if (failures.length) throw failures[0];
}

export function ensureAccountColumns() {
  if (!pending) {
    pending = applyAccountColumns().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}
