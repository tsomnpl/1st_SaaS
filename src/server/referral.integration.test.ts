import { CreditTransactionType } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { REFERRAL_CODE_PATTERN } from "@/lib/referral-code";
import { prisma } from "@/lib/prisma";
import { confirmPaymentByToken } from "@/server/payments";
import { claimReferral, ensureReferralCode } from "@/server/referral";

const prefix = `it_ref_${Date.now()}`;

describe.sequential("referral bonus", () => {
  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { clerkUserId: { startsWith: prefix } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    if (userIds.length) {
      await prisma.referral.deleteMany({
        where: { OR: [{ referrerUserId: { in: userIds } }, { referredUserId: { in: userIds } }] },
      });
      await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditTransaction.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditBucket.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditAccount.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.webhookEvent.deleteMany({ where: { eventKey: { contains: prefix } } });
    await prisma.$disconnect();
  });

  async function makeUser(name: string, createdAt = new Date()) {
    return prisma.user.create({
      data: { clerkUserId: `${prefix}_${name}`, name, createdAt },
    });
  }

  it("gives a stable unique code and waits for a paid pack before the bonus", async () => {
    const referrer = await makeUser("referrer");
    const first = await ensureReferralCode(referrer.id);
    const second = await ensureReferralCode(referrer.id);
    expect(first).toBe(second);
    expect(first).toMatch(REFERRAL_CODE_PATTERN);
    expect(first.includes("@")).toBe(false);

    const other = await makeUser("other");
    const otherCode = await ensureReferralCode(other.id);
    expect(otherCode).not.toBe(first);

    const invited = await makeUser("invited");
    const rewarded = await claimReferral({
      referredUserId: invited.id,
      referredClerkUserId: invited.clerkUserId,
      referredCreatedAt: invited.createdAt,
      code: first,
    });
    expect(rewarded.status).toBe("linked");
    const again = await claimReferral({
      referredUserId: invited.id,
      referredClerkUserId: invited.clerkUserId,
      referredCreatedAt: invited.createdAt,
      code: first,
    });
    expect(again.status).toBe("already");
    const bonusesBeforePay = await prisma.creditTransaction.findMany({
      where: { userId: referrer.id, type: CreditTransactionType.BONUS },
    });
    expect(bonusesBeforePay).toHaveLength(0);
    const accountBefore = await prisma.creditAccount.findUnique({ where: { userId: referrer.id } });
    expect(accountBefore?.balance ?? 0).toBe(0);

    const parallelGuest = await makeUser("parallel");
    const raced = await Promise.all([
      claimReferral({
        referredUserId: parallelGuest.id,
        referredClerkUserId: parallelGuest.clerkUserId,
        referredCreatedAt: parallelGuest.createdAt,
        code: first,
      }),
      claimReferral({
        referredUserId: parallelGuest.id,
        referredClerkUserId: parallelGuest.clerkUserId,
        referredCreatedAt: parallelGuest.createdAt,
        code: first,
      }),
    ]);
    expect(raced.filter((item) => item.status === "linked")).toHaveLength(1);
    expect(raced.filter((item) => item.status === "already")).toHaveLength(1);
    const afterRace = await prisma.creditTransaction.count({
      where: { userId: referrer.id, type: CreditTransactionType.BONUS },
    });
    expect(afterRace).toBe(0);
  });

  it("gives 1 Mint to the referrer and 1 Mint to the invited person after the pack is paid", async () => {
    const referrer = await prisma.user.findFirstOrThrow({ where: { clerkUserId: `${prefix}_referrer` } });
    const invited = await prisma.user.findFirstOrThrow({ where: { clerkUserId: `${prefix}_invited` } });
    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: "STARTER_2K" } });
    const orderId = `${prefix}-order`;
    const token = `${prefix}-token`;
    await prisma.payment.create({
      data: {
        userId: invited.id,
        planId: plan.id,
        orderId,
        tokenPay: token,
        amountFcfa: plan.priceFcfa,
        status: "PENDING",
      },
    });
    const verified = async () => ({ status: "completed", orderId, amount: plan.priceFcfa });
    const payload = { status: "payin.session.completed", orderId, amount: plan.priceFcfa };
    await confirmPaymentByToken(token, payload, verified);
    await confirmPaymentByToken(token, payload, verified);

    const referrerBonus = await prisma.creditTransaction.findMany({
      where: { userId: referrer.id, type: CreditTransactionType.BONUS },
    });
    const guestBonus = await prisma.creditTransaction.findMany({
      where: { userId: invited.id, type: CreditTransactionType.BONUS },
    });
    expect(referrerBonus).toHaveLength(1);
    expect(guestBonus).toHaveLength(1);
    expect(referrerBonus[0]?.amount).toBe(1);
    expect(guestBonus[0]?.amount).toBe(1);
    expect(JSON.stringify(referrerBonus[0]?.metadata)).toContain(`Parrainage, ${referrer.referralCode}`);
    const referrerAccount = await prisma.creditAccount.findUniqueOrThrow({ where: { userId: referrer.id } });
    const guestAccount = await prisma.creditAccount.findUniqueOrThrow({ where: { userId: invited.id } });
    expect(referrerAccount.balance).toBe(1);
    expect(guestAccount.balance).toBe(plan.mintAmount + 1);
    const row = await prisma.referral.findUniqueOrThrow({ where: { referredUserId: invited.id } });
    expect(row.status).toBe("REWARDED");
  });

  it("blocks self referral, old accounts, invalid codes, and still pays several real invites", async () => {
    const referrer = await prisma.user.findFirstOrThrow({ where: { clerkUserId: `${prefix}_referrer` } });
    const code = referrer.referralCode ?? "";
    const self = await claimReferral({
      referredUserId: referrer.id,
      referredClerkUserId: referrer.clerkUserId,
      referredCreatedAt: new Date(),
      code,
    });
    expect(self.status).toBe("self");

    const old = await makeUser("old", new Date("2026-01-01T00:00:00.000Z"));
    expect(
      (
        await claimReferral({
          referredUserId: old.id,
          referredClerkUserId: old.clerkUserId,
          referredCreatedAt: old.createdAt,
          code,
          now: new Date("2026-09-30T00:00:00.000Z"),
        })
      ).status,
    ).toBe("too_old");

    const fresh = await makeUser("fresh");
    expect(
      (
        await claimReferral({
          referredUserId: fresh.id,
          referredClerkUserId: fresh.clerkUserId,
          referredCreatedAt: fresh.createdAt,
          code: "FM-NOPE",
        })
      ).status,
    ).toBe("invalid");
    expect(
      (
        await claimReferral({
          referredUserId: fresh.id,
          referredClerkUserId: fresh.clerkUserId,
          referredCreatedAt: fresh.createdAt,
          code: null,
        })
      ).status,
    ).toBe("invalid");

    const extra = await Promise.all([makeUser("a"), makeUser("b"), makeUser("c")].map(async (pending, index) => {
      const row = await pending;
      return claimReferral({
        referredUserId: row.id,
        referredClerkUserId: row.clerkUserId,
        referredCreatedAt: row.createdAt,
        code,
        now: new Date(Date.now() + index),
      });
    }));
    expect(extra.every((item) => item.status === "linked")).toBe(true);
    const balance = await prisma.creditAccount.findUnique({ where: { userId: referrer.id } });
    expect(balance?.balance).toBe(1);
  });
});
