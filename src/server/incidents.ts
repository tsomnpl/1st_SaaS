import { IncidentSeverity, IncidentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatSequenceId } from "@/lib/support-policy";
import { notifyAdmins } from "@/server/notifications";
import { enqueueAndSend, emailSettings } from "@/server/email";
import { writeAdminLog } from "@/server/admin-audit";

async function nextIncidentId() {
  const year = new Date().getUTCFullYear();
  const prefix = `INC-${year}-`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const count = await prisma.incident.count({ where: { publicId: { startsWith: prefix } } });
    const publicId = formatSequenceId("INC", year, count + 1 + attempt);
    const exists = await prisma.incident.findUnique({ where: { publicId } });
    if (!exists) return publicId;
  }
  return formatSequenceId("INC", year, Date.now() % 1_000_000);
}

export async function recordIncident(input: {
  type: string;
  severity?: IncidentSeverity;
  service: string;
  summary: string;
  detail?: string;
  userId?: string | null;
  generationId?: string | null;
  paymentId?: string | null;
}) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await prisma.incident.findFirst({
    where: {
      type: input.type,
      status: { in: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING] },
      generationId: input.generationId ?? undefined,
      paymentId: input.paymentId ?? undefined,
      createdAt: { gte: since },
    },
  });
  if (existing) return existing;

  const incident = await prisma.incident.create({
    data: {
      publicId: await nextIncidentId(),
      type: input.type,
      severity: input.severity ?? IncidentSeverity.NORMAL,
      service: input.service,
      summary: input.summary.slice(0, 240),
      detail: input.detail?.slice(0, 2000),
      userId: input.userId ?? null,
      generationId: input.generationId ?? null,
      paymentId: input.paymentId ?? null,
    },
  });

  await notifyAdmins({
    type: "INCIDENT",
    title: incident.publicId,
    body: incident.summary,
    href: "/admin/monitoring",
    dedupeKey: `incident:${incident.id}`,
  });
  const admin = emailSettings().admin;
  if (admin && (incident.severity === "HIGH" || incident.severity === "CRITICAL")) {
    await enqueueAndSend({
      template: "IncidentNotification",
      to: admin,
      entityId: incident.id,
      payload: { subject: incident.publicId, summary: incident.summary },
    });
  }
  return incident;
}

export async function updateIncident(input: {
  incidentId: string;
  adminUserId: string;
  status: IncidentStatus;
}) {
  const incident = await prisma.incident.update({
    where: { id: input.incidentId },
    data: {
      status: input.status,
      resolvedAt: input.status === "RESOLVED" || input.status === "CLOSED" ? new Date() : null,
    },
  });
  await writeAdminLog({
    adminUserId: input.adminUserId,
    action: "INCIDENT_STATUS",
    targetType: "INCIDENT",
    targetId: incident.id,
    metadata: { status: input.status, publicId: incident.publicId } as Prisma.InputJsonValue,
  });
  return incident;
}
