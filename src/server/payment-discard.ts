import { CreditTransactionType, PaymentStatus } from "@prisma/client";
import { paymentCanBeDiscarded } from "@/lib/payment-discard";
import { prisma } from "@/lib/prisma";

export async function discardPayment(input: { adminUserId: string; paymentId: string }) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: input.paymentId } });
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");
    const purchase = await tx.creditTransaction.findFirst({
      where: {
        userId: payment.userId,
        type: CreditTransactionType.PURCHASE,
        reference: payment.orderId,
      },
      select: { id: true },
    });
    if (
      !paymentCanBeDiscarded({
        status: payment.status,
        creditedAt: payment.creditedAt,
        creditedByPurchase: Boolean(purchase),
      })
    ) {
      throw new Error("PAYMENT_NOT_DISCARDABLE");
    }
    await tx.supportTicket.updateMany({
      where: { paymentId: payment.id },
      data: { paymentId: null },
    });
    await tx.payment.delete({ where: { id: payment.id } });
    await tx.adminLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "DISCARD_PAYMENT",
        targetType: "PAYMENT",
        targetId: payment.id,
        metadata: {
          orderId: payment.orderId,
          status: payment.status,
          amountFcfa: payment.amountFcfa,
        },
      },
    });
    return { id: payment.id, orderId: payment.orderId, status: payment.status };
  });
}

export async function discardUncreditedPayments(adminUserId: string, paymentIds?: string[]) {
  const rows = await prisma.payment.findMany({
    where: {
      status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
      creditedAt: null,
      ...(paymentIds ? { id: { in: paymentIds } } : {}),
    },
    select: { id: true },
  });
  let deleted = 0;
  let skipped = 0;
  for (const row of rows) {
    try {
      await discardPayment({ adminUserId, paymentId: row.id });
      deleted += 1;
    } catch (error) {
      if (error instanceof Error && error.message === "PAYMENT_NOT_DISCARDABLE") {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }
  return { deleted, skipped };
}
