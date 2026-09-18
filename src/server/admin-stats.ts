import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function startOf(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export async function getAdminStats() {
  const now = new Date();
  const today = startOf(0);
  const week = startOf(6);
  const month = startOf(29);

  const [usersTotal, usersActive, usersSuspended, payments, generations, mintAggregate, transactions, recentLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.payment.findMany({ include: { plan: true, user: true } }),
      prisma.generation.findMany(),
      prisma.creditAccount.aggregate({ _sum: { balance: true } }),
      prisma.creditTransaction.findMany(),
      prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { admin: true } }),
    ]);

  const completed = payments.filter((p) => p.status === PaymentStatus.COMPLETED);
  const revenueIn = (from: Date) =>
    completed.filter((p) => p.createdAt >= from).reduce((sum, p) => sum + p.amountFcfa, 0);

  const mintsSold = completed.reduce((sum, p) => sum + p.plan.mintAmount, 0);
  const mintsConsumed = transactions.filter((t) => t.type === "GENERATION").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const mintsExpired = transactions.filter((t) => t.type === "EXPIRATION").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const mintsFree = transactions.filter((t) => t.type === "FREE_GRANT").reduce((sum, t) => sum + t.amount, 0);
  const mintsAdminAdd = transactions.filter((t) => t.type === "ADMIN_ADD").reduce((sum, t) => sum + t.amount, 0);
  const mintsRefunded = transactions.filter((t) => t.type === "REFUND").reduce((sum, t) => sum + t.amount, 0);
  const rodiCost = generations.reduce((sum, g) => sum + (g.rodiCost ?? 0), 0);
  const failedGens = generations.filter((g) => g.status === "FAILED").length;
  const successGens = generations.filter((g) => g.status === "COMPLETED").length;
  const errorRate = generations.length ? failedGens / generations.length : 0;
  const pendingPayments = payments.filter((p) => p.status === PaymentStatus.PENDING);

  const alerts = [
    errorRate >= 0.3 && generations.length >= 5
      ? { tone: "orange", text: "Taux d’erreur de génération inhabituellement élevé." }
      : null,
    pendingPayments.length >= 5
      ? { tone: "orange", text: "Plusieurs paiements restent en attente." }
      : null,
    mintsConsumed >= 50
      ? { tone: "mint", text: "Forte consommation de Mints constatée." }
      : null,
  ].filter(Boolean);

  return {
    usersTotal,
    usersActive,
    usersSuspended,
    usersNewWeek: await prisma.user.count({ where: { createdAt: { gte: week } } }),
    revenue: completed.reduce((sum, p) => sum + p.amountFcfa, 0),
    revenueToday: revenueIn(today),
    revenueWeek: revenueIn(week),
    revenueMonth: revenueIn(month),
    remainingMints: mintAggregate._sum.balance ?? 0,
    generations: generations.length,
    generationsSuccess: successGens,
    generationsFailed: failedGens,
    errorRate,
    mintsSold,
    mintsConsumed,
    mintsExpired,
    mintsFree,
    mintsAdminAdd,
    mintsRefunded,
    rodiCost,
    pendingPayments: pendingPayments.length,
    failedPayments: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
    cancelledPayments: payments.filter((p) => p.status === PaymentStatus.CANCELLED).length,
    successfulPayments: completed.length,
    now: now.toISOString(),
    alerts,
    activity: [
      ...recentLogs.map((log) => ({
        at: log.createdAt,
        text: `${log.action} · ${log.admin.email ?? "admin"} · ${log.targetType}`,
      })),
      ...completed.slice(-5).map((p) => ({
        at: p.createdAt,
        text: `Paiement ${p.status} · ${p.amountFcfa} FCFA · ${p.user.email ?? p.userId}`,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 10)
      .map((item) => ({ ...item, at: item.at.toISOString() })),
  };
}
