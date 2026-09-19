import { prisma } from "@/lib/prisma";

export function isMissingBrandKitRelation(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "P2021" || code === "P2022") return true;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /brandkit/i.test(message) && /does not exist|n'existe pas/i.test(message);
}

let ensuringTable: Promise<void> | null = null;

async function ensureBrandKitTable() {
  if (!ensuringTable) {
    ensuringTable = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BrandKit" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "colors" TEXT[],
          "logoUrl" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "BrandKit_userId_key" ON "BrandKit"("userId")`,
      );
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "BrandKit"
          ADD CONSTRAINT "BrandKit_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
    })().catch(() => undefined);
  }
  await ensuringTable;
}

export async function getBrandKit(userId: string) {
  try {
    return await prisma.brandKit.findUnique({ where: { userId } });
  } catch (error) {
    if (!isMissingBrandKitRelation(error)) return null;
    await ensureBrandKitTable();
    try {
      return await prisma.brandKit.findUnique({ where: { userId } });
    } catch {
      return null;
    }
  }
}

export async function saveBrandKit(userId: string, input: { colors: string[]; logoUrl?: string }) {
  const colors = input.colors.map((color) => color.trim()).filter(Boolean).slice(0, 3);
  const logoUrl = input.logoUrl?.startsWith("data:image/") || input.logoUrl?.startsWith("https://")
    ? input.logoUrl
    : undefined;

  const write = () =>
    prisma.brandKit.upsert({
      where: { userId },
      create: { userId, colors, logoUrl },
      update: {
        colors: colors.length ? colors : undefined,
        logoUrl: logoUrl || undefined,
      },
    });

  try {
    return await write();
  } catch (error) {
    if (!isMissingBrandKitRelation(error)) return null;
    await ensureBrandKitTable();
    try {
      return await write();
    } catch {
      return null;
    }
  }
}
