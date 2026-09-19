import { prisma } from "@/lib/prisma";

export async function getBrandKit(userId: string) {
  return prisma.brandKit.findUnique({ where: { userId } });
}

export async function saveBrandKit(userId: string, input: { colors: string[]; logoUrl?: string }) {
  const colors = input.colors.map((color) => color.trim()).filter(Boolean).slice(0, 3);
  const logoUrl = input.logoUrl?.startsWith("data:image/") || input.logoUrl?.startsWith("https://")
    ? input.logoUrl
    : undefined;

  return prisma.brandKit.upsert({
    where: { userId },
    create: { userId, colors, logoUrl },
    update: {
      colors: colors.length ? colors : undefined,
      logoUrl: logoUrl || undefined,
    },
  });
}
