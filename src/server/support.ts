import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  MessageVisibility,
  Prisma,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type SupportQueue,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertTicketAccess,
  CATEGORY_LABEL,
  formatSequenceId,
  publicTicketView,
  resolveTicketClassification,
  safeStorageKey,
  stripSensitiveBrief,
  subjectsLookSimilar,
  validateAttachment,
} from "@/lib/support-policy";
import { writeAdminLog } from "@/server/admin-audit";
import { getAppUrl } from "@/lib/env";
import { enqueueAndSend, queueAddressFor } from "@/server/email";
import { notifyAdmins, notifyUser } from "@/server/notifications";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "support");

async function nextTicketPublicId() {
  const year = new Date().getUTCFullYear();
  const prefix = `FM-${year}-`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const count = await prisma.ticket.count({ where: { publicId: { startsWith: prefix } } });
    const publicId = formatSequenceId("FM", year, count + 1 + attempt);
    const exists = await prisma.ticket.findUnique({ where: { publicId } });
    if (!exists) return publicId;
  }
  throw new Error("TICKET_ID_FAILED");
}

export async function createTicket(input: {
  userId: string;
  email?: string | null;
  subject: string;
  description: string;
  category?: TicketCategory | null;
  priority?: TicketPriority | null;
  generationId?: string | null;
  paymentId?: string | null;
}) {
  const subject = input.subject.trim().slice(0, 160);
  const description = input.description.trim().slice(0, 4000);
  if (subject.length < 3 || description.length < 5) throw new Error("INVALID_TICKET");

  const recent = await prisma.ticket.count({
    where: { userId: input.userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= 8) throw new Error("RATE_LIMITED");

  const classified = resolveTicketClassification({
    subject,
    description,
    category: input.category,
    priority: input.priority,
  });

  let generationId: string | null = null;
  let paymentId: string | null = null;
  let contextPublic: Prisma.InputJsonValue | undefined;
  let contextInternal: Prisma.InputJsonValue | undefined;

  if (input.generationId) {
    const generation = await prisma.generation.findFirst({
      where: { id: input.generationId, userId: input.userId },
    });
    if (!generation) throw new Error("NOT_FOUND");
    generationId = generation.id;
    const quality = (generation.qualityDetails ?? {}) as Record<string, unknown>;
    const brief = stripSensitiveBrief(generation.brief);
    contextPublic = {
      generationId: generation.id,
      status: generation.status,
      createdAt: generation.createdAt.toISOString(),
      title: String((brief as { title?: string }).title ?? ""),
      outputAvailable: Boolean(generation.outputUrl),
    } as Prisma.InputJsonValue;
    contextInternal = {
      model: generation.model,
      rodiCost: generation.rodiCost,
      status: generation.status,
      visualRefUsed: Boolean(quality.visual_ref_used),
      personalReferenceUsed: Boolean((brief as { clientImageAttached?: boolean }).clientImageAttached || (brief as { logoAttached?: boolean }).logoAttached),
      brief,
      artDirection: stripSensitiveBrief(generation.artDirection),
      qualityScore: generation.qualityScore,
    } as Prisma.InputJsonValue;
  }

  if (input.paymentId) {
    const payment = await prisma.payment.findFirst({
      where: { id: input.paymentId, userId: input.userId },
    });
    if (!payment) throw new Error("NOT_FOUND");
    paymentId = payment.id;
    contextPublic = {
      ...(typeof contextPublic === "object" && contextPublic ? contextPublic : {}),
      paymentId: payment.id,
      amountFcfa: payment.amountFcfa,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
    } as Prisma.InputJsonValue;
    contextInternal = {
      ...(typeof contextInternal === "object" && contextInternal ? contextInternal : {}),
      orderId: payment.orderId,
      status: payment.status,
      amountFcfa: payment.amountFcfa,
    } as Prisma.InputJsonValue;
  }

  const similar = await prisma.ticket.findFirst({
    where: { userId: input.userId, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
  });
  const similarPublicId = similar && subjectsLookSimilar(similar.subject, subject) ? similar.publicId : null;

  const publicId = await nextTicketPublicId();
  const ticket = await prisma.ticket.create({
    data: {
      publicId,
      userId: input.userId,
      subject,
      category: classified.category,
      priority: classified.priority,
      status: TicketStatus.NEW,
      generationId,
      paymentId,
      contextPublic,
      contextInternal,
      messages: {
        create: { authorUserId: input.userId, body: description, visibility: MessageVisibility.PUBLIC },
      },
      assignments: { create: { queue: classified.queue } },
      events: {
        create: {
          type: "TICKET_CREATED",
          actorUserId: input.userId,
          payload: { category: classified.category, priority: classified.priority, queue: classified.queue },
        },
      },
    },
  });

  await notifyUser({
    userId: input.userId,
    type: "TICKET_CREATED",
    title: `Demande ${ticket.publicId}`,
    body: "Nous avons bien reçu ta demande.",
    href: `/support/${ticket.id}`,
    dedupeKey: `ticket-created:${ticket.id}`,
  });
  await notifyAdmins({
    type: classified.priority === "URGENT" || classified.priority === "HIGH" ? "TICKET_URGENT" : "TICKET_NEW",
    title: ticket.publicId,
    body: subject,
    href: `/admin/support/${ticket.id}`,
    dedupeKey: `ticket-new:${ticket.id}`,
  });

  if (input.email) {
    await enqueueAndSend({
      template: "TicketCreated",
      to: input.email,
      entityId: ticket.id,
      payload: {
        publicId: ticket.publicId,
        categoryLabel: CATEGORY_LABEL[ticket.category],
        summary: subject,
        href: `${getAppUrl()}/support/${ticket.id}`,
        ticketRef: ticket.id,
      },
    });
  }
  const inbox = queueAddressFor(classified.queue);
  if (inbox) {
    await enqueueAndSend({
      template: "AdminAlert",
      to: inbox,
      entityId: `staff:${ticket.id}`,
      payload: { subject: `Nouveau ticket ${ticket.publicId}`, summary: `${CATEGORY_LABEL[ticket.category]} — ${subject}` },
    });
  }

  return { ticket, similarPublicId };
}

const ticketInclude = {
  messages: { orderBy: { createdAt: "asc" as const }, include: { author: { select: { id: true, name: true, role: true } } } },
  attachments: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true } },
  assignments: { orderBy: { createdAt: "desc" as const }, take: 5 },
  events: { orderBy: { createdAt: "asc" as const } },
};

export async function getTicketForActor(input: { ticketId: string; actorId: string; isAdmin: boolean }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId }, include: ticketInclude });
  if (!ticket) throw new Error("NOT_FOUND");
  assertTicketAccess({ actorId: input.actorId, ownerId: ticket.userId, isAdmin: input.isAdmin });
  if (input.isAdmin) return ticket;
  return publicTicketView(ticket);
}

export async function addTicketMessage(input: {
  ticketId: string;
  actorId: string;
  isAdmin: boolean;
  body: string;
  visibility?: MessageVisibility;
}) {
  const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) throw new Error("NOT_FOUND");
  assertTicketAccess({ actorId: input.actorId, ownerId: ticket.userId, isAdmin: input.isAdmin });
  const body = input.body.trim().slice(0, 4000);
  if (body.length < 1) throw new Error("INVALID_TICKET");
  const visibility = input.visibility === MessageVisibility.INTERNAL && input.isAdmin ? MessageVisibility.INTERNAL : MessageVisibility.PUBLIC;
  if (visibility === MessageVisibility.INTERNAL && !input.isAdmin) throw new Error("FORBIDDEN");

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const burst = await prisma.ticketMessage.count({
    where: { ticketId: ticket.id, authorUserId: input.actorId, createdAt: { gte: hourAgo } },
  });
  if (burst >= 20) throw new Error("RATE_LIMITED");

  const message = await prisma.ticketMessage.create({
    data: { ticketId: ticket.id, authorUserId: input.actorId, body, visibility },
  });

  const nextStatus =
    visibility === MessageVisibility.INTERNAL
      ? ticket.status
      : input.isAdmin
        ? ticket.status === TicketStatus.NEW
          ? TicketStatus.OPEN
          : TicketStatus.WAITING_USER
        : ticket.status === TicketStatus.WAITING_USER || ticket.status === TicketStatus.RESOLVED
          ? TicketStatus.OPEN
          : ticket.status;

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: nextStatus,
      firstResponseAt: input.isAdmin && visibility === MessageVisibility.PUBLIC && !ticket.firstResponseAt ? new Date() : ticket.firstResponseAt,
    },
  });
  await prisma.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      type: visibility === MessageVisibility.INTERNAL ? "INTERNAL_NOTE" : "MESSAGE",
      actorUserId: input.actorId,
    },
  });

  if (visibility === MessageVisibility.PUBLIC && input.isAdmin) {
    await notifyUser({
      userId: ticket.userId,
      type: "TICKET_REPLY",
      title: `Réponse ${ticket.publicId}`,
      body: "Le support a répondu à ta demande.",
      href: `/support/${ticket.id}`,
      dedupeKey: `reply:${message.id}`,
    });
    const owner = await prisma.user.findUnique({ where: { id: ticket.userId } });
    if (owner?.email) {
      await enqueueAndSend({
        template: "TicketReply",
        to: owner.email,
        entityId: message.id,
        payload: { publicId: ticket.publicId, summary: "Une réponse est disponible dans le centre d’aide.", href: `${getAppUrl()}/support/${ticket.id}`, ticketRef: ticket.id },
      });
    }
  }
  if (visibility === MessageVisibility.PUBLIC && !input.isAdmin) {
    await notifyAdmins({
      type: "TICKET_REPLY",
      title: ticket.publicId,
      body: "Nouveau message utilisateur.",
      href: `/admin/support/${ticket.id}`,
      dedupeKey: `user-reply:${message.id}`,
    });
  }
  if (input.isAdmin) {
    await writeAdminLog({
      adminUserId: input.actorId,
      action: visibility === MessageVisibility.INTERNAL ? "TICKET_INTERNAL_NOTE" : "TICKET_REPLY",
      targetType: "TICKET",
      targetId: ticket.id,
    });
  }
  return message;
}

export async function updateTicketByAdmin(input: {
  ticketId: string;
  adminUserId: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  queue?: SupportQueue;
  assigneeUserId?: string | null;
}) {
  const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) throw new Error("NOT_FOUND");
  const data: Prisma.TicketUpdateInput = {};
  if (input.status) {
    data.status = input.status;
    if (input.status === TicketStatus.RESOLVED) data.resolvedAt = new Date();
    if (input.status === TicketStatus.CLOSED) data.closedAt = new Date();
  }
  if (input.priority) data.priority = input.priority;
  const updated = await prisma.ticket.update({ where: { id: ticket.id }, data });
  if (input.queue || input.assigneeUserId !== undefined) {
    await prisma.ticketAssignment.create({
      data: {
        ticketId: ticket.id,
        queue: input.queue ?? "SUPPORT",
        assigneeUserId: input.assigneeUserId ?? null,
      },
    });
  }
  await prisma.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      type: "TICKET_UPDATED",
      actorUserId: input.adminUserId,
      payload: { status: input.status, priority: input.priority, queue: input.queue },
    },
  });
  await writeAdminLog({
    adminUserId: input.adminUserId,
    action: "TICKET_UPDATED",
    targetType: "TICKET",
    targetId: ticket.id,
    metadata: { status: input.status, priority: input.priority, queue: input.queue },
  });
  if (input.status === TicketStatus.RESOLVED || input.status === TicketStatus.CLOSED) {
    await notifyUser({
      userId: ticket.userId,
      type: input.status === TicketStatus.RESOLVED ? "TICKET_RESOLVED" : "TICKET_CLOSED",
      title: ticket.publicId,
      body: input.status === TicketStatus.RESOLVED ? "Ta demande est résolue." : "Ta demande est fermée.",
      href: `/support/${ticket.id}`,
      dedupeKey: `${input.status}:${ticket.id}`,
    });
    const owner = await prisma.user.findUnique({ where: { id: ticket.userId } });
    if (owner?.email) {
      await enqueueAndSend({
        template: input.status === TicketStatus.RESOLVED ? "TicketResolved" : "TicketClosed",
        to: owner.email,
        entityId: `${input.status}:${ticket.id}`,
        payload: { publicId: ticket.publicId, href: `${getAppUrl()}/support/${ticket.id}`, ticketRef: ticket.id },
      });
    }
  }
  return updated;
}

export async function closeOwnTicket(userId: string, ticketId: string) {
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, userId } });
  if (!ticket) throw new Error("NOT_FOUND");
  return prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: TicketStatus.CLOSED, closedAt: new Date() },
  });
}

export async function saveTicketAttachment(input: { ticketId: string; actorId: string; isAdmin: boolean; bytes: Uint8Array; fileName: string }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) throw new Error("NOT_FOUND");
  assertTicketAccess({ actorId: input.actorId, ownerId: ticket.userId, isAdmin: input.isAdmin });
  const checked = validateAttachment({ bytes: input.bytes, fileName: input.fileName });
  const storedName = `${randomBytes(8).toString("hex")}-${checked.fileName}`;
  const key = safeStorageKey(ticket.id, storedName);
  const absolute = path.join(STORAGE_ROOT, key);
  if (!absolute.startsWith(STORAGE_ROOT)) throw new Error("ATTACHMENT_REJECTED");
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, input.bytes);
  return prisma.ticketAttachment.create({
    data: {
      ticketId: ticket.id,
      uploadedByUserId: input.actorId,
      storageKey: key,
      fileName: checked.fileName,
      mimeType: checked.mime,
      sizeBytes: checked.sizeBytes,
    },
  });
}

export async function readTicketAttachment(input: { attachmentId: string; actorId: string; isAdmin: boolean }) {
  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id: input.attachmentId },
    include: { ticket: true },
  });
  if (!attachment) throw new Error("NOT_FOUND");
  assertTicketAccess({ actorId: input.actorId, ownerId: attachment.ticket.userId, isAdmin: input.isAdmin });
  const absolute = path.join(STORAGE_ROOT, attachment.storageKey);
  if (!absolute.startsWith(STORAGE_ROOT)) throw new Error("FORBIDDEN");
  const bytes = await readFile(absolute);
  return { attachment, bytes };
}

export async function listOwnTickets(userId: string, page = 1) {
  const take = 20;
  const skip = Math.max(0, page - 1) * take;
  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: { id: true, publicId: true, subject: true, status: true, priority: true, category: true, createdAt: true, updatedAt: true },
    }),
    prisma.ticket.count({ where: { userId } }),
  ]);
  return { items, total, page };
}

export async function listAdminTickets(query: {
  status?: string;
  priority?: string;
  category?: string;
  queue?: string;
  q?: string;
  page?: number;
}) {
  const take = 20;
  const page = Number.isFinite(query.page) ? Math.max(1, query.page ?? 1) : 1;
  const where: Prisma.TicketWhereInput = {};
  if (query.status && query.status !== "ALL") where.status = query.status as TicketStatus;
  if (query.priority && query.priority !== "ALL") where.priority = query.priority as TicketPriority;
  if (query.category && query.category !== "ALL") where.category = query.category as TicketCategory;
  if (query.queue && query.queue !== "ALL") where.assignments = { some: { queue: query.queue as SupportQueue } };
  if (query.q) {
    const q = query.q.trim();
    where.OR = [
      { publicId: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { userId: q },
      { generationId: q },
      { paymentId: q },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: {
        user: { select: { email: true, id: true } },
        assignments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.ticket.count({ where }),
  ]);
  return { items, total, page };
}
