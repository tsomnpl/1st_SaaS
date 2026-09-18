import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminBasePath } from "@/lib/env";

export type AdminPeriod = "1" | "7" | "30" | "90" | "365" | "all";

function startOfDay(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function periodStart(period: AdminPeriod) {
  if (period === "all") return new Date(0);
  return startOfDay(Math.max(0, Number(period) - 1));
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function seriesDays(period: AdminPeriod) {
  if (period === "all") return 30;
  return Math.min(365, Math.max(1, Number(period)));
}

function emptySeries(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = startOfDay(days - 1 - index);
    return { label: dayKey(date), value: 0 };
  });
}

function fillSeries<T>(
  days: number,
  items: T[],
  getDate: (item: T) => Date,
  getValue: (item: T) => number,
) {
  const series = emptySeries(days);
  const index = new Map(series.map((point, i) => [point.label, i]));
  for (const item of items) {
    const key = dayKey(getDate(item));
    const i = index.get(key);
    if (i == null) continue;
    series[i].value += getValue(item);
  }
  return series;
}

function durationMs(createdAt: Date, updatedAt: Date, qualityDetails: unknown) {
  if (qualityDetails && typeof qualityDetails === "object" && "durationMs" in qualityDetails) {
    const value = Number((qualityDetails as { durationMs?: unknown }).durationMs);
    if (Number.isFinite(value) && value > 0) return value;
  }
  const delta = updatedAt.getTime() - createdAt.getTime();
  return delta > 0 ? delta : 0;
}

function briefField(brief: unknown, key: string) {
  if (!brief || typeof brief !== "object") return "";
  const value = (brief as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export async function getAdminStats(period: AdminPeriod = "30") {
  const now = new Date();
  const today = startOfDay(0);
  const week = startOfDay(6);
  const month = startOfDay(29);
  const from = periodStart(period);
  const days = seriesDays(period);
  const base = getAdminBasePath();

  const [
    usersTotal,
    usersActive,
    usersSuspended,
    usersNewWeek,
    usersNewPeriod,
    payments,
    generations,
    mintAggregate,
    transactions,
    recentLogs,
    webhooks,
    webhookDupes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.user.count({ where: { createdAt: { gte: from } } }),
    prisma.payment.findMany({ include: { plan: true, user: true } }),
    prisma.generation.findMany({ include: { user: true } }),
    prisma.creditAccount.aggregate({ _sum: { balance: true } }),
    prisma.creditTransaction.findMany(),
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { admin: true } }),
    prisma.webhookEvent.count(),
    prisma.webhookEvent.count({
      where: { eventKey: { contains: "duplicate" } },
    }),
  ]);

  const completed = payments.filter((payment) => payment.status === PaymentStatus.COMPLETED);
  const pendingPayments = payments.filter((payment) => payment.status === PaymentStatus.PENDING);
  const failedPayments = payments.filter((payment) => payment.status === PaymentStatus.FAILED);
  const cancelledPayments = payments.filter((payment) => payment.status === PaymentStatus.CANCELLED);
  const periodPayments = completed.filter((payment) => payment.createdAt >= from);
  const periodGenerations = generations.filter((generation) => generation.createdAt >= from);
  const periodTransactions = transactions.filter((tx) => tx.createdAt >= from);

  const revenueIn = (since: Date) =>
    completed.filter((payment) => payment.createdAt >= since).reduce((sum, payment) => sum + payment.amountFcfa, 0);

  const mintsSold = completed.reduce((sum, payment) => sum + payment.plan.mintAmount, 0);
  const mintsConsumed = transactions.filter((tx) => tx.type === "GENERATION").reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const mintsExpired = transactions.filter((tx) => tx.type === "EXPIRATION").reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const mintsFree = transactions.filter((tx) => tx.type === "FREE_GRANT").reduce((sum, tx) => sum + tx.amount, 0);
  const mintsAdminAdd = transactions.filter((tx) => tx.type === "ADMIN_ADD").reduce((sum, tx) => sum + tx.amount, 0);
  const mintsBonus = transactions.filter((tx) => tx.type === "BONUS").reduce((sum, tx) => sum + tx.amount, 0);
  const mintsRefunded = transactions.filter((tx) => tx.type === "REFUND").reduce((sum, tx) => sum + tx.amount, 0);
  const mintsAdminRemove = transactions.filter((tx) => tx.type === "ADMIN_REMOVE").reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const successGens = generations.filter((generation) => generation.status === "COMPLETED");
  const failedGens = generations.filter((generation) => generation.status === "FAILED");
  const periodSuccess = periodGenerations.filter((generation) => generation.status === "COMPLETED");
  const periodFailed = periodGenerations.filter((generation) => generation.status === "FAILED");
  const regenerations = generations.filter((generation) => Boolean(briefField(generation.brief, "regenerateFromId"))).length;
  const errorRate = generations.length ? failedGens.length / generations.length : 0;
  const durations = successGens.map((generation) => durationMs(generation.createdAt, generation.updatedAt, generation.qualityDetails));
  const avgDurationMs = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;

  const rodiAll = generations.reduce((sum, generation) => sum + (generation.rodiCost ?? 0), 0);
  const rodiIn = (since: Date) =>
    generations.filter((generation) => generation.createdAt >= since).reduce((sum, generation) => sum + (generation.rodiCost ?? 0), 0);
  const avgRodi = successGens.length ? rodiAll / successGens.length : 0;

  const modelsMap = new Map<string, { count: number; cost: number; failed: number; duration: number }>();
  for (const generation of generations) {
    const key = generation.model || "inconnu";
    const current = modelsMap.get(key) ?? { count: 0, cost: 0, failed: 0, duration: 0 };
    current.count += 1;
    current.cost += generation.rodiCost ?? 0;
    if (generation.status === "FAILED") current.failed += 1;
    current.duration += durationMs(generation.createdAt, generation.updatedAt, generation.qualityDetails);
    modelsMap.set(key, current);
  }
  const models = [...modelsMap.entries()].map(([model, stats]) => ({
    model,
    count: stats.count,
    cost: stats.cost,
    avgCost: stats.count ? stats.cost / stats.count : 0,
    errorRate: stats.count ? stats.failed / stats.count : 0,
    avgDurationMs: stats.count ? stats.duration / stats.count : 0,
  }));

  const revenueByPlan = Object.values(
    completed.reduce<Record<string, { plan: string; amount: number; count: number }>>((acc, payment) => {
      const key = payment.plan.code;
      acc[key] ??= { plan: payment.plan.name, amount: 0, count: 0 };
      acc[key].amount += payment.amountFcfa;
      acc[key].count += 1;
      return acc;
    }, {}),
  );

  const alerts = [
    errorRate >= 0.3 && generations.length >= 5
      ? { tone: "orange", text: "Taux d’erreur de génération inhabituellement élevé.", href: `${base}/rodium` }
      : null,
    pendingPayments.length >= 5
      ? { tone: "orange", text: "Plusieurs paiements restent en attente.", href: `${base}/payments` }
      : null,
    mintsConsumed >= 50
      ? { tone: "mint", text: "Forte consommation de Mints constatée.", href: `${base}/mints` }
      : null,
    avgDurationMs >= 45_000 && successGens.length >= 3
      ? { tone: "orange", text: "Temps moyen de génération élevé.", href: `${base}/rodium` }
      : null,
    failedPayments.length >= 5
      ? { tone: "orange", text: "Erreurs de paiement détectées.", href: `${base}/payments` }
      : null,
  ].filter(Boolean);

  const activity = [
    ...recentLogs.map((log) => ({
      at: log.createdAt,
      text: `${log.action} · ${log.admin.email ?? "admin"} · ${log.targetType}`,
      href:
        log.targetType === "USER" && log.targetId
          ? `${base}/users/${log.targetId}`
          : log.targetType === "PAYMENT"
            ? `${base}/payments`
            : `${base}/logs`,
    })),
    ...completed.slice(-8).map((payment) => ({
      at: payment.createdAt,
      text: `Paiement confirmé · ${payment.amountFcfa.toLocaleString("fr-FR")} FCFA · ${payment.user.email ?? payment.userId}`,
      href: `${base}/payments/${payment.id}`,
    })),
    ...generations.slice(-8).map((generation) => ({
      at: generation.createdAt,
      text: `${generation.status === "FAILED" ? "Génération échouée" : "Nouvelle génération"} · ${generation.user.email ?? generation.userId}`,
      href: `${base}/generations`,
    })),
    ...transactions
      .filter((tx) => tx.type === "ADMIN_ADD" || tx.type === "PURCHASE")
      .slice(-6)
      .map((tx) => ({
        at: tx.createdAt,
        text:
          tx.type === "ADMIN_ADD"
            ? `${tx.amount} Mints ajoutés manuellement`
            : `Achat de ${tx.amount} Mints`,
        href: `${base}/mints`,
      })),
  ]
    .sort((left, right) => right.at.getTime() - left.at.getTime())
    .slice(0, 12)
    .map((item) => ({ ...item, at: item.at.toISOString() }));

  return {
    period,
    usersTotal,
    usersActive,
    usersSuspended,
    usersNewWeek,
    usersNewPeriod,
    revenue: completed.reduce((sum, payment) => sum + payment.amountFcfa, 0),
    revenueToday: revenueIn(today),
    revenueWeek: revenueIn(week),
    revenueMonth: revenueIn(month),
    revenuePeriod: periodPayments.reduce((sum, payment) => sum + payment.amountFcfa, 0),
    remainingMints: mintAggregate._sum.balance ?? 0,
    generations: generations.length,
    generationsPeriod: periodGenerations.length,
    generationsSuccess: successGens.length,
    generationsFailed: failedGens.length,
    generationsSuccessPeriod: periodSuccess.length,
    generationsFailedPeriod: periodFailed.length,
    regenerations,
    errorRate,
    avgDurationMs,
    mintsSold,
    mintsConsumed,
    mintsExpired,
    mintsFree,
    mintsBonus,
    mintsAdminAdd,
    mintsAdminRemove,
    mintsRefunded,
    rodiCost: rodiAll,
    rodiToday: rodiIn(today),
    rodiWeek: rodiIn(week),
    rodiMonth: rodiIn(month),
    rodiPeriod: rodiIn(from),
    avgRodi,
    pendingPayments: pendingPayments.length,
    failedPayments: failedPayments.length,
    cancelledPayments: cancelledPayments.length,
    successfulPayments: completed.length,
    webhooks,
    webhookDupes,
    models,
    revenueByPlan,
    revenueSeries: fillSeries(days, periodPayments, (payment) => payment.createdAt, (payment) => payment.amountFcfa),
    userSeries: fillSeries(
      days,
      (await prisma.user.findMany({ where: { createdAt: { gte: startOfDay(days - 1) } }, select: { createdAt: true } })),
      (user) => user.createdAt,
      () => 1,
    ),
    generationSeries: fillSeries(days, periodGenerations, (generation) => generation.createdAt, () => 1),
    mintSeries: fillSeries(
      days,
      periodTransactions.filter((tx) => tx.type === "GENERATION" || tx.type === "PURCHASE" || tx.type === "ADMIN_ADD"),
      (tx) => tx.createdAt,
      (tx) => tx.amount,
    ),
    rodiSeries: fillSeries(days, periodGenerations, (generation) => generation.createdAt, (generation) => generation.rodiCost ?? 0),
    now: now.toISOString(),
    alerts,
    activity,
  };
}
