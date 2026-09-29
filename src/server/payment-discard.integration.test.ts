import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { discardPayment, discardUncreditedPayments } from "@/server/payment-discard";

const prisma = new PrismaClient();
const stamp = `it_discard_${Date.now()}`;

describe.sequential("discard uncredited payments", () => {
  const ids: { adminId?: string; userId?: string } = {};

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { clerkUserId: { startsWith: stamp } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    if (userIds.length) {
      await prisma.adminLog.deleteMany({ where: { adminUserId: { in: userIds } } });
      await prisma.supportTicket.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  it("removes a pending payment and keeps a credited one", async () => {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: "STARTER_2K" } });
    const admin = await prisma.user.create({
      data: { clerkUserId: `${stamp}_admin`, email: `${stamp}-admin@example.com`, role: "ADMIN" },
    });
    const user = await prisma.user.create({
      data: { clerkUserId: `${stamp}_user`, email: `${stamp}-user@example.com` },
    });
    ids.adminId = admin.id;
    ids.userId = user.id;
    const pending = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        orderId: `${stamp}-pending`,
        amountFcfa: plan.priceFcfa,
        status: "PENDING",
      },
    });
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `${stamp}-1`,
        userId: user.id,
        subject: "Paiement",
        category: "PAYMENT",
        paymentId: pending.id,
      },
    });
    const credited = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        orderId: `${stamp}-paid`,
        amountFcfa: plan.priceFcfa,
        status: "COMPLETED",
        creditedAt: new Date(),
      },
    });

    const removed = await discardPayment({ adminUserId: admin.id, paymentId: pending.id });
    expect(removed.orderId).toBe(`${stamp}-pending`);
    expect(await prisma.payment.findUnique({ where: { id: pending.id } })).toBeNull();
    const keptTicket = await prisma.supportTicket.findUniqueOrThrow({ where: { id: ticket.id } });
    expect(keptTicket.paymentId).toBeNull();
    const log = await prisma.adminLog.findFirst({
      where: { adminUserId: admin.id, action: "DISCARD_PAYMENT", targetId: pending.id },
    });
    expect(log?.targetType).toBe("PAYMENT");

    await expect(discardPayment({ adminUserId: admin.id, paymentId: credited.id })).rejects.toThrow(
      "PAYMENT_NOT_DISCARDABLE",
    );
    expect(await prisma.payment.findUnique({ where: { id: credited.id } })).toBeTruthy();

    const failed = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        orderId: `${stamp}-failed`,
        amountFcfa: plan.priceFcfa,
        status: "FAILED",
      },
    });
    const bulk = await discardUncreditedPayments(admin.id, [failed.id, credited.id]);
    expect(bulk.deleted).toBeGreaterThanOrEqual(1);
    expect(await prisma.payment.findUnique({ where: { id: failed.id } })).toBeNull();
    expect(await prisma.payment.findUnique({ where: { id: credited.id } })).toBeTruthy();
  });
});