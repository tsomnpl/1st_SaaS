import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const requireAdminUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireAdminUser,
}));

const prisma = new PrismaClient();
const prefix = `it_mint_${Date.now()}`;

async function ensureWebhookTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WebhookEvent" (
      "id" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "eventKey" TEXT NOT NULL,
      "payload" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_eventKey_key" ON "WebhookEvent"("eventKey")
  `);
}

describe.sequential("admin mint control", () => {
  const ids: { adminId?: string; otherId?: string; newbieId?: string; planId?: string } = {};

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { clerkUserId: { startsWith: prefix } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    if (userIds.length) {
      await prisma.creditTransaction.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditBucket.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.creditAccount.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.pendingMintGrant.deleteMany({
        where: { OR: [{ adminUserId: { in: userIds } }, { userId: { in: userIds } }] },
      });
      await prisma.adminLog.deleteMany({ where: { adminUserId: { in: userIds } } });
      await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (ids.planId) await prisma.plan.deleteMany({ where: { id: ids.planId } });
    await prisma.$disconnect();
  });

  it("refuses the adjust API when the caller is not an admin", async () => {
    const { POST } = await import("@/app/api/admin/mints/adjust/route");
    requireAdminUser.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    const anonymous = await POST(
      new Request("http://localhost/api/admin/mints/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: "someone", amount: 2, reason: "intrusion" }),
      }),
    );
    expect(anonymous.status).toBe(401);

    requireAdminUser.mockRejectedValueOnce(new Error("FORBIDDEN"));
    const member = await POST(
      new Request("http://localhost/api/admin/mints/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: "someone", amount: 2, reason: "intrusion" }),
      }),
    );
    expect(member.status).toBe(403);
    const body = (await member.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });

  it("credits the admin, another user, and a verified email exactly once", async () => {
    await ensureWebhookTable();
    const { getAdminStats } = await import("@/server/admin-stats");
    const baseline = await getAdminStats("all");
    const { POST } = await import("@/app/api/admin/mints/adjust/route");
    const { POST: createGrant } = await import("@/app/api/admin/mints/grants/route");
    const { adjustUserMints, createPendingMintGrant, redeemPendingMintGrants } = await import("@/server/mint-grants");

    const admin = await prisma.user.create({
      data: { clerkUserId: `${prefix}_admin`, email: `${prefix}-admin@example.com`, role: "ADMIN" },
    });
    const other = await prisma.user.create({
      data: { clerkUserId: `${prefix}_other`, email: `${prefix}-other@example.com`, role: "USER" },
    });
    ids.adminId = admin.id;
    ids.otherId = other.id;
    requireAdminUser.mockResolvedValue(admin);

    const self = await POST(
      new Request("http://localhost/api/admin/mints/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: admin.id, amount: 4, reason: "Bonus interne" }),
      }),
    );
    expect(self.status).toBe(200);
    const selfBody = (await self.json()) as {
      ok: boolean;
      type: string;
      amount: number;
      reason: string;
      balanceBefore: number;
      balanceAfter: number;
    };
    expect(selfBody).toMatchObject({
      ok: true,
      type: "ADMIN_ADD",
      amount: 4,
      reason: "Bonus interne",
      balanceBefore: 0,
      balanceAfter: 4,
    });

    const otherAdd = await adjustUserMints({
      adminUserId: admin.id,
      targetUserId: other.id,
      amount: 2,
      reason: "Lot test utilisateur",
    });
    expect(otherAdd).toMatchObject({
      type: "ADMIN_ADD",
      amount: 2,
      balanceBefore: 0,
      balanceAfter: 2,
      reason: "Lot test utilisateur",
    });

    await expect(
      adjustUserMints({
        adminUserId: admin.id,
        targetUserId: other.id,
        amount: -5,
        reason: "Trop large",
      }),
    ).rejects.toThrow("BALANCE_WOULD_BE_NEGATIVE");
    const otherAccount = await prisma.creditAccount.findUnique({ where: { userId: other.id } });
    expect(otherAccount?.balance).toBe(2);

    const pendingEmail = `  ${prefix}-New@Example.com `;
    const created = await createGrant(
      new Request("http://localhost/api/admin/mints/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, amount: 3, reason: "Bienvenue préparée" }),
      }),
    );
    expect(created.status).toBe(200);
    const createdBody = (await created.json()) as { email: string; id: string };
    expect(createdBody.email).toBe(`${prefix}-new@example.com`);

    const unverified = await createPendingMintGrant({
      adminUserId: admin.id,
      email: `${prefix}-unverified@example.com`,
      amount: 6,
      reason: "Pas encore vérifié",
    });
    const skipped = await redeemPendingMintGrants({
      userId: other.id,
      verifiedEmails: [],
    });
    expect(skipped.appliedIds).toEqual([]);
    const stillPending = await prisma.pendingMintGrant.findUnique({ where: { id: unverified.id } });
    expect(stillPending?.status).toBe("PENDING");

    const newbie = await prisma.user.create({
      data: { clerkUserId: `${prefix}_newbie`, email: createdBody.email, role: "USER" },
    });
    ids.newbieId = newbie.id;
    const first = await redeemPendingMintGrants({
      userId: newbie.id,
      verifiedEmails: [createdBody.email],
    });
    const second = await redeemPendingMintGrants({
      userId: newbie.id,
      verifiedEmails: [createdBody.email],
    });
    expect(first.appliedIds).toEqual([createdBody.id]);
    expect(second.appliedIds).toEqual([]);
    const newbieAccount = await prisma.creditAccount.findUnique({ where: { userId: newbie.id } });
    expect(newbieAccount?.balance).toBe(3);
    const grantLines = await prisma.creditTransaction.findMany({
      where: { reference: `MINT_GRANT:${createdBody.id}` },
    });
    expect(grantLines).toHaveLength(1);
    expect(grantLines[0]).toMatchObject({ type: "ADMIN_ADD", amount: 3, balanceBefore: 0, balanceAfter: 3 });
    const redeemed = await prisma.pendingMintGrant.findUnique({ where: { id: createdBody.id } });
    expect(redeemed?.status).toBe("REDEEMED");
    expect(redeemed?.userId).toBe(newbie.id);

    const beforeStats = await getAdminStats("all");
    expect(beforeStats.mintsGiftedByAdmin - baseline.mintsGiftedByAdmin).toBe(9);
    expect(beforeStats.giftedMintsUnused - baseline.giftedMintsUnused).toBe(9);
    expect(beforeStats.mintsSold).toBe(baseline.mintsSold);
    expect(beforeStats.revenue).toBe(baseline.revenue);
    const plan = await prisma.plan.create({
      data: {
        code: `${prefix}_plan`.slice(0, 40),
        name: "Test",
        priceFcfa: 2000,
        mintAmount: 2,
        durationDays: 30,
      },
    });
    ids.planId = plan.id;
    await prisma.payment.create({
      data: {
        userId: other.id,
        planId: plan.id,
        orderId: `${prefix}_order`,
        amountFcfa: 2000,
        status: "COMPLETED",
      },
    });

    const stats = await getAdminStats("all");
    expect(stats.mintsSold - beforeStats.mintsSold).toBe(2);
    expect(stats.revenue - beforeStats.revenue).toBe(2000);
    expect(stats.mintsGiftedByAdmin - beforeStats.mintsGiftedByAdmin).toBe(0);
    expect(stats.giftedMintsUnused - beforeStats.giftedMintsUnused).toBe(0);
    expect(stats.mintsGiftedByAdmin).toBeGreaterThanOrEqual(4 + 2 + 3);

    const selfLog = await prisma.adminLog.findFirst({
      where: { adminUserId: admin.id, action: "ADMIN_ADD_MINT", targetId: admin.id },
    });
    expect(selfLog).not.toBeNull();
  });
});
