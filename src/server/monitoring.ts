import { prisma } from "@/lib/prisma";
import { failureRateMetric } from "@/lib/support-policy";
import { getRodiumWallet, rodiumDisponible } from "@/server/rodium";

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function monitoringThresholds() {
  return {
    minSample: numberEnv("MONITOR_MIN_SAMPLE", 20),
    failureRate: numberEnv("MONITOR_GEN_FAILURE_RATE", 0.15),
    webhookFailures: numberEnv("MONITOR_WEBHOOK_FAILURES", 5),
    slowGenerationMs: numberEnv("MONITOR_SLOW_GENERATION_MS", 60_000),
  };
}

export async function monitoringSnapshot() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const thresholds = monitoringThresholds();
  const [
    completed,
    failed,
    payments,
    webhookCount,
    openIncidents,
    urgentTickets,
    openTickets,
  ] = await Promise.all([
    prisma.generation.count({ where: { status: "COMPLETED", createdAt: { gte: since } } }),
    prisma.generation.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true }, where: { createdAt: { gte: since } } }),
    prisma.webhookEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.incident.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.ticket.count({ where: { priority: { in: ["HIGH", "URGENT"] }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.ticket.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
  ]);

  let database: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  const wallet = await getRodiumWallet().catch(() => null);
  const disponible = rodiumDisponible(wallet);
  const reserved = wallet ? Number(wallet.reserved_rodi ?? wallet.reserved ?? NaN) : null;
  const balance = wallet ? Number(wallet.balance_rodi ?? wallet.balance ?? NaN) : null;
  const rodiFailures = await prisma.incident.count({
    where: { type: "RODIUM_INSUFFICIENT_BALANCE", createdAt: { gte: since } },
  });
  const avg = await prisma.generation.aggregate({
    where: { createdAt: { gte: since }, rodiCost: { not: null } },
    _avg: { rodiCost: true },
    _count: { _all: true },
    _sum: { rodiCost: true },
  });

  const rate = failureRateMetric({ completed, failed, minSample: thresholds.minSample });
  const paymentMap = Object.fromEntries(payments.map((row) => [row.status, row._count._all]));
  const alerts: string[] = [];
  if (rate.sufficient && rate.rate !== null && rate.rate >= thresholds.failureRate) {
    alerts.push("Taux d’échec des générations au-dessus du seuil.");
  }
  if (database === "error") alerts.push("Base de données injoignable.");
  if (!wallet) alerts.push("Portefeuille image indisponible ou non configuré.");
  if (disponible !== null && disponible < 1) alerts.push("Solde image libre insuffisant.");
  const failedPayments = (paymentMap.FAILED ?? 0) + (paymentMap.CANCELLED ?? 0);
  if (failedPayments >= thresholds.webhookFailures) alerts.push("Plusieurs paiements non confirmés sur 24 h.");

  return {
    thresholds,
    database,
    clerkConfigured: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
    moneyFusionConfigured: Boolean(process.env.MONEY_FUSION_API_URL),
    rodium: {
      reachable: Boolean(wallet),
      disponible,
      reserved: Number.isFinite(reserved) ? reserved : null,
      balance: Number.isFinite(balance) ? balance : null,
      generations24h: avg._count._all,
      avgCost: avg._avg.rodiCost,
      sumCost: avg._sum.rodiCost,
      insufficientIncidents: rodiFailures,
    },
    generations: {
      completed,
      failed,
      failureRate: rate,
    },
    payments: paymentMap,
    webhooks24h: webhookCount,
    support: { openIncidents, urgentTickets, openTickets },
    alerts,
  };
}

export async function supportDashboardStats() {
  const [byStatus, byCategory, byPriority, ratings] = await Promise.all([
    prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.generationFeedback.aggregate({ where: { rating: { not: null } }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const responded = await prisma.ticket.findMany({
    where: { firstResponseAt: { not: null } },
    select: { createdAt: true, firstResponseAt: true, resolvedAt: true },
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  const firstResponseHours = responded
    .map((row) => (row.firstResponseAt!.getTime() - row.createdAt.getTime()) / 3_600_000)
    .filter((value) => value >= 0);
  const resolutionHours = responded
    .filter((row) => row.resolvedAt)
    .map((row) => (row.resolvedAt!.getTime() - row.createdAt.getTime()) / 3_600_000)
    .filter((value) => value >= 0);
  const avg = (values: number[]) => (values.length >= 3 ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = await prisma.ticket.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const perDay = new Map<string, number>();
  for (const row of recent) {
    const key = row.createdAt.toISOString().slice(0, 10);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  return {
    byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
    byCategory: Object.fromEntries(byCategory.map((row) => [row.category, row._count._all])),
    byPriority: Object.fromEntries(byPriority.map((row) => [row.priority, row._count._all])),
    avgFirstResponseHours: avg(firstResponseHours),
    avgResolutionHours: avg(resolutionHours),
    satisfaction: ratings._count._all >= 3 ? ratings._avg.rating : null,
    satisfactionCount: ratings._count._all,
    perDay: [...perDay.entries()],
  };
}
