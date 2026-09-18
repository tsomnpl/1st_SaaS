import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  const [usersTotal, usersActive, payments, generations, mintAggregate, transactions] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.payment.findMany({ include: { plan: true } }),
      prisma.generation.findMany(),
      prisma.creditAccount.aggregate({ _sum: { balance: true } }),
      prisma.creditTransaction.findMany(),
    ]);

  const completed = payments.filter((p) => p.status === PaymentStatus.COMPLETED);
  const revenue = completed.reduce((sum, p) => sum + p.amountFcfa, 0);
  const mintsSold = completed.reduce((sum, p) => sum + p.plan.mintAmount, 0);
  const mintsConsumed = transactions
    .filter((t) => t.type === "GENERATION")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const mintsExpired = transactions
    .filter((t) => t.type === "EXPIRATION")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const mintsFree = transactions
    .filter((t) => t.type === "FREE_GRANT")
    .reduce((sum, t) => sum + t.amount, 0);
  const rodiCost = generations.reduce((sum, g) => sum + (g.rodiCost ?? 0), 0);

  return {
    usersTotal,
    usersActive,
    revenue,
    remainingMints: mintAggregate._sum.balance ?? 0,
    generations: generations.length,
    mintsSold,
    mintsConsumed,
    mintsExpired,
    mintsFree,
    rodiCost,
    pendingPayments: payments.filter((p) => p.status === PaymentStatus.PENDING).length,
    failedPayments: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
    successfulPayments: completed.length,
  };
}
