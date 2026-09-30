import { CreditTransactionType, Prisma } from "@prisma/client";
import { isPromoCodeShape, normalizePromoCode, promoBlockReason } from "@/lib/promo-code";
import { prisma } from "@/lib/prisma";
import { writeAdminLog } from "@/server/admin-audit";
import { grantCredits } from "@/server/credits";
import { notifyUser } from "@/server/notifications";

const MINT_MIN = 1;
const MINT_MAX = 100;
const USES_MIN = 1;
const USES_MAX = 100_000;

export async function listPromoCodes() {
  return prisma.promoCode.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}

export async function createPromoCode(
  adminUserId: string,
  input: { code: string; mintAmount: number; maxUses: number },
) {
  const code = normalizePromoCode(input.code);
  if (!isPromoCodeShape(code)) throw new Error("PROMO_INVALID");
  if (!Number.isInteger(input.mintAmount) || input.mintAmount < MINT_MIN || input.mintAmount > MINT_MAX) {
    throw new Error("INVALID_MINT_AMOUNT");
  }
  if (!Number.isInteger(input.maxUses) || input.maxUses < USES_MIN || input.maxUses > USES_MAX) {
    throw new Error("PROMO_INVALID");
  }
  try {
    const created = await prisma.promoCode.create({
      data: { code, mintAmount: input.mintAmount, maxUses: input.maxUses },
    });
    await writeAdminLog({
      adminUserId,
      action: "PROMO_CREATE",
      targetType: "PROMO_CODE",
      targetId: created.id,
      metadata: { code, mintAmount: input.mintAmount, maxUses: input.maxUses },
    });
    return created;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("PROMO_TAKEN");
    }
    throw error;
  }
}

export async function deletePromoCode(adminUserId: string, id: string) {
  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) throw new Error("PROMO_NOT_FOUND");
  await prisma.promoCode.delete({ where: { id } });
  await writeAdminLog({
    adminUserId,
    action: "PROMO_DELETE",
    targetType: "PROMO_CODE",
    targetId: id,
    metadata: { code: existing.code, usedCount: existing.usedCount },
  });
}

export async function redeemPromoCode(userId: string, rawCode: string) {
  const code = normalizePromoCode(rawCode);
  if (!isPromoCodeShape(code)) throw new Error("PROMO_INVALID");

  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ id: string; code: string; mintAmount: number; maxUses: number; usedCount: number; active: boolean }>
    >`SELECT "id", "code", "mintAmount", "maxUses", "usedCount", "active" FROM "PromoCode" WHERE "code" = ${code} FOR UPDATE`;
    const promo = rows[0];
    if (!promo) throw new Error("PROMO_NOT_FOUND");
    const prior = await tx.promoRedemption.findUnique({
      where: { promoCodeId_userId: { promoCodeId: promo.id, userId } },
    });
    const blocked = promoBlockReason({
      active: promo.active,
      usedCount: promo.usedCount,
      maxUses: promo.maxUses,
      alreadyRedeemed: Boolean(prior),
    });
    if (blocked) throw new Error(blocked);

    await tx.promoRedemption.create({
      data: { promoCodeId: promo.id, userId, mintAmount: promo.mintAmount },
    });
    await tx.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: { increment: 1 } },
    });
    const granted = await grantCredits(userId, promo.mintAmount, CreditTransactionType.BONUS, {
      tx,
      reference: `promo:${promo.id}:${userId}`,
      metadata: { reason: `Code promo ${promo.code}`, promoCodeId: promo.id },
    });
    return { code: promo.code, mintAmount: promo.mintAmount, balanceAfter: granted.balanceAfter };
  });

  await notifyUser({
    userId,
    type: "PROMO",
    title: "Code promo utilisé",
    body: `${result.mintAmount} Mint${result.mintAmount > 1 ? "s" : ""} ajoutés avec le code ${result.code}.`,
    href: "/dashboard",
    dedupeKey: `promo:${result.code}`,
  });
  return result;
}
