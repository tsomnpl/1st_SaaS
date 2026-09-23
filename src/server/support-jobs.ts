import { IncidentSeverity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retryQueuedEmails, enqueueAndSend } from "@/server/email";
import { recordIncident } from "@/server/incidents";
import { notifyUser } from "@/server/notifications";
import { monitoringThresholds } from "@/server/monitoring";

export async function runSupportMaintenance() {
  const emails = await retryQueuedEmails();
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const buckets = await prisma.creditBucket.findMany({
    where: { remainingAmount: { gt: 0 }, expiresAt: { gt: new Date(), lte: soon } },
    take: 40,
  });
  let mintReminders = 0;
  for (const bucket of buckets) {
    const user = await prisma.user.findUnique({ where: { id: bucket.userId } });
    await notifyUser({
      userId: bucket.userId,
      type: "MINT_EXPIRING",
      title: "Mints bientôt expirés",
      body: "Une partie de tes Mints expire dans les 7 jours.",
      href: "/dashboard",
      dedupeKey: `mint-expiring:${bucket.id}`,
    });
    if (user?.email) {
      const sent = await enqueueAndSend({
        template: "MintExpiring",
        to: user.email,
        entityId: bucket.id,
        payload: { summary: "Certains Mints expirent dans les 7 prochains jours." },
      });
      if (sent) mintReminders += 1;
    }
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const failed = await prisma.generation.count({ where: { status: "FAILED", createdAt: { gte: hourAgo } } });
  if (failed >= monitoringThresholds().minSample) {
    await recordIncident({
      type: "REPEATED_ERROR",
      severity: IncidentSeverity.HIGH,
      service: "generation",
      summary: `${failed} générations échouées sur la dernière heure.`,
    });
  }

  const slow = await prisma.generation.findMany({
    where: { status: "COMPLETED", createdAt: { gte: hourAgo } },
    select: { id: true, userId: true, createdAt: true, updatedAt: true },
    take: 30,
  });
  const slowMs = monitoringThresholds().slowGenerationMs;
  for (const row of slow) {
    if (row.updatedAt.getTime() - row.createdAt.getTime() > slowMs) {
      await recordIncident({
        type: "SLOW_GENERATION",
        severity: IncidentSeverity.LOW,
        service: "generation",
        summary: "Temps de génération au-dessus du seuil.",
        userId: row.userId,
        generationId: row.id,
      });
    }
  }

  return { emails, mintReminders, failed };
}
