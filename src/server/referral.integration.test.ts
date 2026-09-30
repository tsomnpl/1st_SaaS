import { CreditTransactionType } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { REFERRAL_CODE_PATTERN } from "@/lib/referral-code";
import { prisma } from "@/lib/prisma";
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
      await prisma.creditTransaction.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditBucket.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditAccount.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  async function makeUser(name: string, createdAt = new Date()) {
    return prisma.user.create({
      data: { clerkUserId: `${prefix}_${name}`, name, createdAt },
    });
  }

  it("gives a stable unique code and one bonus after a real signup", async () => {
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
    expect(rewarded.status).toBe("rewarded");
    const again = await claimReferral({
      referredUserId: invited.id,
      referredClerkUserId: invited.clerkUserId,
      referredCreatedAt: invited.createdAt,
      code: first,
    });
    expect(again.status).toBe("already");
    const bonuses = await prisma.creditTransaction.findMany({
      where: { userId: referrer.id, type: CreditTransactionType.BONUS },
    });
    expect(bonuses).toHaveLength(1);
    expect(bonuses[0]?.amount).toBe(1);
    expect(JSON.stringify(bonuses[0]?.metadata)).toContain(`Parrainage, ${first}`);
    const account = await prisma.creditAccount.findUnique({ where: { userId: referrer.id } });
    expect(account?.balance).toBe(1);

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
    expect(raced.filter((item) => item.status === "rewarded")).toHaveLength(1);
    expect(raced.filter((item) => item.status === "already")).toHaveLength(1);
    const afterRace = await prisma.creditTransaction.count({
      where: { userId: referrer.id, type: CreditTransactionType.BONUS },
    });
    expect(afterRace).toBe(2);
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
    expect(extra.every((item) => item.status === "rewarded")).toBe(true);
    const balance = await prisma.creditAccount.findUnique({ where: { userId: referrer.id } });
    expect(balance?.balance).toBeGreaterThanOrEqual(5);
  });
});
