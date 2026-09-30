import { CreditTransactionType } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createPromoCode, deletePromoCode, redeemPromoCode } from "@/server/promo";

const prefix = `it_promo_${Date.now()}`;
const createdCodes: string[] = [];

describe.sequential("promo codes", () => {
  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { clerkUserId: { startsWith: prefix } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    if (userIds.length) {
      await prisma.adminLog.deleteMany({ where: { adminUserId: { in: userIds } } });
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.promoRedemption.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditTransaction.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditBucket.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditAccount.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (createdCodes.length) {
      await prisma.promoCode.deleteMany({ where: { code: { in: createdCodes } } });
    }
    await prisma.$disconnect();
  });

  async function makeUser(name: string) {
    return prisma.user.create({ data: { clerkUserId: `${prefix}_${name}`, name, role: "ADMIN" } });
  }

  it("gives the mint once, stops at the person limit, and can be deleted", async () => {
    const admin = await makeUser("admin");
    const first = await makeUser("first");
    const second = await makeUser("second");
    const code = `P${Date.now().toString(36).toUpperCase()}`;
    createdCodes.push(code);
    const created = await createPromoCode(admin.id, { code, mintAmount: 3, maxUses: 1 });

    const redeemed = await redeemPromoCode(first.id, `  ${code.toLowerCase()} `);
    expect(redeemed.mintAmount).toBe(3);
    expect(redeemed.balanceAfter).toBe(3);
    await expect(redeemPromoCode(first.id, code)).rejects.toThrow("PROMO_ALREADY_USED");
    await expect(redeemPromoCode(second.id, code)).rejects.toThrow("PROMO_EXHAUSTED");

    const bonus = await prisma.creditTransaction.findMany({
      where: { userId: first.id, type: CreditTransactionType.BONUS },
    });
    expect(bonus).toHaveLength(1);
    expect(bonus[0]?.amount).toBe(3);

    const notice = await prisma.notification.findFirst({ where: { userId: first.id, type: "PROMO" } });
    expect(notice?.title).toContain("Code promo");

    await deletePromoCode(admin.id, created.id);
    expect(await prisma.promoCode.findUnique({ where: { id: created.id } })).toBeNull();
    const kept = await prisma.creditAccount.findUnique({ where: { userId: first.id } });
    expect(kept?.balance).toBe(3);
  });
});
