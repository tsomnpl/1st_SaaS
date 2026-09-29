import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { confirmPaymentByToken } from "@/server/payments";

const prisma = new PrismaClient();
const stamp = `${Date.now()}`;
const clerkUserId = `it_pay_${stamp}`;
const orderId = `FM-IT-${stamp}`;
const token = `tokit${stamp}`;
const pendingOrderId = `FM-IT-PEND-${stamp}`;
const pendingToken = `tokpend${stamp}`;

describe.sequential("money fusion credit idempotence", () => {
  let userId = "";

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { clerkUserId },
      select: { id: true },
    });
    const ids = users.map((user) => user.id);
    if (ids.length) {
      await prisma.creditTransaction.deleteMany({ where: { userId: { in: ids } } });
      await prisma.creditBucket.deleteMany({ where: { userId: { in: ids } } });
      await prisma.creditAccount.deleteMany({ where: { userId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.webhookEvent.deleteMany({
      where: { eventKey: { contains: stamp } },
    });
    await prisma.$disconnect();
  });

  it("credits the pack once when the same confirmed webhook is replayed", async () => {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: "STARTER_2K" } });
    const user = await prisma.user.create({ data: { clerkUserId } });
    userId = user.id;
    await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        orderId,
        tokenPay: token,
        amountFcfa: plan.priceFcfa,
        status: "PENDING",
      },
    });

    const verified = async () => ({ status: "completed", orderId, amount: plan.priceFcfa });
    const payload = { status: "payin.session.completed", orderId, amount: plan.priceFcfa };
    const first = await confirmPaymentByToken(token, payload, verified);
    const second = await confirmPaymentByToken(token, payload, verified);
    const account = await prisma.creditAccount.findUniqueOrThrow({ where: { userId: user.id } });
    const purchases = await prisma.creditTransaction.findMany({
      where: { userId: user.id, type: "PURCHASE", reference: orderId },
    });

    expect(first.status).toBe("COMPLETED");
    expect(second.status).toBe("COMPLETED");
    expect(first.creditedAt).toBeTruthy();
    expect(account.balance).toBe(plan.mintAmount);
    expect(purchases).toHaveLength(1);
    expect(purchases[0]?.amount).toBe(plan.mintAmount);
  });

  it("does not credit when the server verification is not completed", async () => {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: "STARTER_2K" } });
    await prisma.payment.create({
      data: {
        userId,
        planId: plan.id,
        orderId: pendingOrderId,
        tokenPay: pendingToken,
        amountFcfa: plan.priceFcfa,
        status: "PENDING",
      },
    });
    const before = await prisma.creditAccount.findUniqueOrThrow({ where: { userId } });
    const result = await confirmPaymentByToken(
      pendingToken,
      { status: "completed", orderId: pendingOrderId, amount: plan.priceFcfa },
      async () => ({ status: "pending", orderId: pendingOrderId, amount: plan.priceFcfa }),
    );
    const after = await prisma.creditAccount.findUniqueOrThrow({ where: { userId } });
    expect(result.status).not.toBe("COMPLETED");
    expect(after.balance).toBe(before.balance);
  });
});
