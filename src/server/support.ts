import "server-only";
import { Prisma, type SupportPriority, type SupportStatus } from "@prisma/client";
import { getAdminPrivatePath, getAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  createTicketSchema,
  detectImageMime,
  formatSupportDate,
  formatTicketNumber,
  generationContext,
  paymentContext,
  safeFileName,
  supportEmailKey,
  supportNoticeRecipients,
  visibleToUser,
  type SUPPORT_CATEGORIES,
} from "@/lib/support";
import { writeAdminLog } from "@/server/admin-audit";
import type { MailResult } from "@/server/mail";
import { sendSupportNotice } from "@/server/mail";
import {
  newTicketAdminMessage,
  supportReplyUserMessage,
  ticketCreatedMessage,
  ticketStatusUserMessage,
  userReplyAdminMessage,
} from "@/server/mail-messages";

type Category = (typeof SUPPORT_CATEGORIES)[number];

export type SupportSender = (input: { to: string; subject: string; text: string; html: string }) => Promise<MailResult>;

const defaultSender: SupportSender = (input) => sendSupportNotice(input);

const NOTIFY_STATUSES = new Set<SupportStatus>(["IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"]);

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function supportInbox() {
  return supportNoticeRecipients(process.env)[0] ?? "";
}

async function notifyInboxes(input: {
  ticketId: string;
  messageId?: string | null;
  eventType: string;
  scope: string;
  content: { subject: string; text: string; html: string };
  send: SupportSender;
}) {
  const recipients = supportNoticeRecipients(process.env);
  if (recipients.length === 0) {
    await recordAndSend({ ...input, to: "" });
    return;
  }
  for (const to of recipients) {
    await recordAndSend({ ...input, to, scope: `${input.scope}:${to.toLowerCase()}` });
  }
}

function adminTicketUrl(ticketNumber: string) {
  const path = getAdminPrivatePath();
  if (!path) return null;
  return `${getAppUrl()}/c/${path}/support/${ticketNumber}`;
}

function userTicketUrl(ticketNumber: string) {
  return `${getAppUrl()}/support/${ticketNumber}`;
}

function contextLines(context: unknown) {
  if (!context || typeof context !== "object") return [];
  const value = context as { generation?: { generationId?: string; status?: string; model?: string }; payment?: { orderId?: string; amountFcfa?: number; status?: string; planName?: string } };
  const lines: string[] = [];
  if (value.generation?.generationId) {
    lines.push(`Génération : ${value.generation.generationId}`);
    if (value.generation.status) lines.push(`Statut génération : ${value.generation.status}`);
    if (value.generation.model) lines.push(`Modèle : ${value.generation.model}`);
  }
  if (value.payment?.orderId) {
    lines.push(`Paiement : ${value.payment.orderId}`);
    if (typeof value.payment.amountFcfa === "number") lines.push(`Montant : ${value.payment.amountFcfa} FCFA`);
    if (value.payment.planName) lines.push(`Offre : ${value.payment.planName}`);
    if (value.payment.status) lines.push(`Statut paiement : ${value.payment.status}`);
  }
  return lines;
}

async function nextTicketNumber(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<Array<{ next: number }>>`
    INSERT INTO "SupportSequence" ("id", "next") VALUES (1, 1)
    ON CONFLICT ("id") DO UPDATE SET "next" = "SupportSequence"."next" + 1
    RETURNING "next"
  `;
  const next = Number(rows[0]?.next);
  if (!Number.isFinite(next) || next < 1) throw new Error("SUPPORT_SEQUENCE_FAILED");
  return formatTicketNumber(next);
}

async function ownedGeneration(userId: string, generationId?: string) {
  if (!generationId) return null;
  const row = await prisma.generation.findFirst({ where: { id: generationId, userId } });
  if (!row) throw new Error("NOT_FOUND");
  return row;
}

async function ownedPayment(userId: string, paymentId?: string) {
  if (!paymentId) return null;
  const row = await prisma.payment.findFirst({
    where: { id: paymentId, userId },
    include: { plan: true },
  });
  if (!row) throw new Error("NOT_FOUND");
  return row;
}

const ticketInclude = {
  messages: { orderBy: { createdAt: "asc" as const }, include: { attachments: { select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true } } } },
  attachments: { select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true, messageId: true } },
  user: { select: { id: true, email: true, name: true } },
};

export async function createSupportTicket(
  raw: unknown,
  userId: string,
  send: SupportSender = defaultSender,
) {
  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) throw new Error("INVALID_SUPPORT");
  const input = parsed.data;
  const [generation, payment] = await Promise.all([
    ownedGeneration(userId, input.generationId),
    ownedPayment(userId, input.paymentId),
  ]);
  const context = {
    ...(generation ? { generation: generationContext(generation) } : {}),
    ...(payment ? { payment: paymentContext(payment) } : {}),
  };
  const created = await prisma.$transaction(async (tx) => {
    if (input.clientRequestId) {
      const existing = await tx.supportTicket.findUnique({
        where: { userId_clientRequestId: { userId, clientRequestId: input.clientRequestId } },
      });
      if (existing) return { ticketId: existing.id, created: false as const };
    }
    const ticketNumber = await nextTicketNumber(tx);
    const ticket = await tx.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        subject: input.subject,
        category: input.category,
        priority: input.priority ?? "MEDIUM",
        generationId: generation?.id,
        paymentId: payment?.id,
        context: Object.keys(context).length ? context : undefined,
        clientRequestId: input.clientRequestId,
      },
    });
    const message = await tx.supportMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: userId,
        authorType: "USER",
        content: input.message,
        isInternal: false,
      },
    });
    return { ticketId: ticket.id, messageId: message.id, created: true as const };
  });
  const ticket = await prisma.supportTicket.findUniqueOrThrow({
    where: { id: created.ticketId },
    include: ticketInclude,
  });
  if (created.created && created.messageId) {
    const content = newTicketAdminMessage({
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      category: CATEGORY_LABEL[ticket.category],
      priority: PRIORITY_LABEL[ticket.priority],
      userLabel: ticket.user.email || ticket.user.name || "Compte FlyerMint",
      preview: input.message.slice(0, 240),
      contextLines: contextLines(ticket.context),
      adminUrl: adminTicketUrl(ticket.ticketNumber),
      createdAt: formatSupportDate(ticket.createdAt),
    });
    await notifyInboxes({
      ticketId: ticket.id,
      messageId: created.messageId,
      eventType: "TICKET_CREATED",
      scope: created.messageId,
      content,
      send,
    });
    const author = ticket.user.email ?? "";
    await recordAndSend({
      ticketId: ticket.id,
      messageId: created.messageId,
      eventType: "TICKET_RECEIPT",
      scope: created.messageId,
      to: author,
      content: ticketCreatedMessage({
        ticketId: ticket.ticketNumber,
        subject: ticket.subject,
        message: input.message.slice(0, 800),
      }),
      send,
    });
  }
  return presentUserTicket(ticket);
}

export async function listUserTickets(userId: string) {
  const rows = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return rows.map((ticket) => ({
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    category: ticket.category,
    categoryLabel: CATEGORY_LABEL[ticket.category],
    priority: ticket.priority,
    priorityLabel: PRIORITY_LABEL[ticket.priority],
    status: ticket.status,
    statusLabel: STATUS_LABEL[ticket.status],
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }));
}

export async function getUserTicket(userId: string, ticketNumber: string) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { ticketNumber, userId },
    include: ticketInclude,
  });
  if (!ticket) throw new Error("NOT_FOUND");
  return presentUserTicket(ticket);
}

export async function addUserMessage(userId: string, ticketNumber: string, message: string, send: SupportSender = defaultSender) {
  const text = message.trim();
  if (text.length < 2 || text.length > 4000) throw new Error("INVALID_SUPPORT");
  const ticket = await prisma.supportTicket.findFirst({ where: { ticketNumber, userId } });
  if (!ticket) throw new Error("NOT_FOUND");
  const reopen = ticket.status === "RESOLVED" || ticket.status === "CLOSED" || ticket.status === "WAITING_USER";
  const saved = await prisma.$transaction(async (tx) => {
    const row = await tx.supportMessage.create({
      data: { ticketId: ticket.id, authorId: userId, authorType: "USER", content: text, isInternal: false },
    });
    await tx.supportTicket.update({
      where: { id: ticket.id },
      data: reopen ? { status: "OPEN", resolvedAt: null, closedAt: null } : {},
    });
    return row;
  });
  const content = userReplyAdminMessage({
    ticketNumber: ticket.ticketNumber,
    preview: text.slice(0, 240),
    adminUrl: adminTicketUrl(ticket.ticketNumber),
  });
  await notifyInboxes({
    ticketId: ticket.id,
    messageId: saved.id,
    eventType: "USER_REPLY",
    scope: saved.id,
    content,
    send,
  });
  return getUserTicket(userId, ticketNumber);
}

export async function addSupportAttachment(input: {
  userId: string;
  ticketNumber: string;
  fileName: string;
  declaredMime: string;
  bytes: Buffer;
  asAdmin?: boolean;
}) {
  if (input.bytes.length < 16 || input.bytes.length > MAX_ATTACHMENT_BYTES) throw new Error("INVALID_ATTACHMENT");
  const mime = detectImageMime(input.bytes);
  if (!mime) throw new Error("INVALID_ATTACHMENT");
  if (input.declaredMime && input.declaredMime !== mime && input.declaredMime !== "application/octet-stream") {
    throw new Error("INVALID_ATTACHMENT");
  }
  const ticket = input.asAdmin
    ? await prisma.supportTicket.findUnique({ where: { ticketNumber: input.ticketNumber } })
    : await prisma.supportTicket.findFirst({ where: { ticketNumber: input.ticketNumber, userId: input.userId } });
  if (!ticket) throw new Error("NOT_FOUND");
  const count = await prisma.supportAttachment.count({ where: { ticketId: ticket.id } });
  if (count >= MAX_ATTACHMENTS) throw new Error("ATTACHMENT_LIMIT");
  const fileName = safeFileName(input.fileName);
  const row = await prisma.supportAttachment.create({
    data: {
      ticketId: ticket.id,
      storageKey: `support/${ticket.id}/${crypto.randomUUID()}`,
      fileName,
      mimeType: mime,
      size: input.bytes.length,
      bytes: Uint8Array.from(input.bytes),
    },
  });
  await prisma.supportTicket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
  return { id: row.id, fileName: row.fileName, mimeType: row.mimeType, size: row.size };
}

export async function readSupportAttachment(input: { attachmentId: string; userId: string; asAdmin: boolean }) {
  const row = await prisma.supportAttachment.findUnique({
    where: { id: input.attachmentId },
    include: { ticket: { select: { userId: true } } },
  });
  if (!row) throw new Error("NOT_FOUND");
  if (!input.asAdmin && row.ticket.userId !== input.userId) throw new Error("NOT_FOUND");
  return row;
}

export async function supportStats() {
  const [grouped, urgent] = await Promise.all([
    prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supportTicket.count({
      where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS", "WAITING_USER"] } },
    }),
  ]);
  const count = (status: SupportStatus) => grouped.find((row) => row.status === status)?._count._all ?? 0;
  return {
    open: count("OPEN"),
    inProgress: count("IN_PROGRESS"),
    waitingUser: count("WAITING_USER"),
    resolved: count("RESOLVED"),
    closed: count("CLOSED"),
    urgent,
  };
}

export async function listAdminTickets(query: {
  q?: string;
  status?: string;
  priority?: string;
  category?: string;
}) {
  const q = query.q?.trim() ?? "";
  const status = query.status && query.status in STATUS_LABEL ? (query.status as SupportStatus) : undefined;
  const priority = query.priority && query.priority in PRIORITY_LABEL ? (query.priority as SupportPriority) : undefined;
  const category = query.category && query.category in CATEGORY_LABEL ? (query.category as Category) : undefined;
  const rows = await prisma.supportTicket.findMany({
    where: {
      status,
      priority,
      category,
      ...(q
        ? {
            OR: [
              { ticketNumber: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { user: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return rows.map((ticket) => ({
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    category: ticket.category,
    categoryLabel: CATEGORY_LABEL[ticket.category],
    priority: ticket.priority,
    priorityLabel: PRIORITY_LABEL[ticket.priority],
    status: ticket.status,
    statusLabel: STATUS_LABEL[ticket.status],
    userEmail: ticket.user.email,
    userName: ticket.user.name,
    updatedAt: ticket.updatedAt.toISOString(),
    createdAt: ticket.createdAt.toISOString(),
  }));
}

export async function getAdminTicket(ticketNumber: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { ticketNumber },
    include: {
      ...ticketInclude,
      emailEvents: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!ticket) throw new Error("NOT_FOUND");
  return {
    ...presentAdminTicket(ticket),
    emailEvents: ticket.emailEvents.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      status: event.status,
      attempts: event.attempts,
      lastError: event.lastError,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export async function patchAdminTicket(
  adminUserId: string,
  ticketNumber: string,
  patch: { status?: SupportStatus; priority?: SupportPriority },
  send: SupportSender = defaultSender,
) {
  const ticket = await prisma.supportTicket.findUnique({ where: { ticketNumber }, include: { user: true } });
  if (!ticket) throw new Error("NOT_FOUND");
  if (!patch.status && !patch.priority) throw new Error("INVALID_SUPPORT");
  const statusChanged = Boolean(patch.status && patch.status !== ticket.status);
  const data: Prisma.SupportTicketUpdateInput = {};
  if (patch.priority) data.priority = patch.priority;
  if (patch.status) {
    data.status = patch.status;
    data.resolvedAt = patch.status === "RESOLVED" ? new Date() : patch.status === "CLOSED" ? ticket.resolvedAt : null;
    data.closedAt = patch.status === "CLOSED" ? new Date() : null;
  }
  const updated = await prisma.supportTicket.update({ where: { id: ticket.id }, data });
  await writeAdminLog({
    adminUserId,
    action: statusChanged ? "SUPPORT_STATUS" : "SUPPORT_PRIORITY",
    targetType: "SUPPORT_TICKET",
    targetId: ticket.ticketNumber,
    metadata: { status: updated.status, priority: updated.priority },
  });
  if (patch.status && statusChanged && NOTIFY_STATUSES.has(patch.status)) {
    const content = ticketStatusUserMessage({
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      statusLabel: STATUS_LABEL[patch.status],
      ticketUrl: userTicketUrl(ticket.ticketNumber),
    });
    await recordAndSend({
      ticketId: ticket.id,
      eventType: `STATUS_${patch.status}`,
      scope: `${patch.status}:${updated.updatedAt.toISOString()}`,
      to: ticket.user.email ?? "",
      content,
      send,
    });
  }
  return getAdminTicket(ticketNumber);
}

export async function addAdminReply(adminUserId: string, ticketNumber: string, message: string, send: SupportSender = defaultSender) {
  const text = message.trim();
  if (text.length < 2 || text.length > 4000) throw new Error("INVALID_SUPPORT");
  const ticket = await prisma.supportTicket.findUnique({ where: { ticketNumber }, include: { user: true } });
  if (!ticket) throw new Error("NOT_FOUND");
  const saved = await prisma.supportMessage.create({
    data: { ticketId: ticket.id, authorId: adminUserId, authorType: "SUPPORT", content: text, isInternal: false },
  });
  if (ticket.status === "OPEN") {
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: "IN_PROGRESS" } });
  } else {
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
  }
  await writeAdminLog({
    adminUserId,
    action: "SUPPORT_REPLY",
    targetType: "SUPPORT_TICKET",
    targetId: ticket.ticketNumber,
  });
  const content = supportReplyUserMessage({
    ticketNumber: ticket.ticketNumber,
    reply: text.slice(0, 800),
    ticketUrl: userTicketUrl(ticket.ticketNumber),
  });
  await recordAndSend({
    ticketId: ticket.id,
    messageId: saved.id,
    eventType: "SUPPORT_REPLY",
    scope: saved.id,
    to: ticket.user.email ?? "",
    content,
    send,
  });
  return getAdminTicket(ticketNumber);
}

export async function addInternalNote(adminUserId: string, ticketNumber: string, message: string) {
  const text = message.trim();
  if (text.length < 2 || text.length > 4000) throw new Error("INVALID_SUPPORT");
  const ticket = await prisma.supportTicket.findUnique({ where: { ticketNumber } });
  if (!ticket) throw new Error("NOT_FOUND");
  await prisma.supportMessage.create({
    data: { ticketId: ticket.id, authorId: adminUserId, authorType: "SUPPORT", content: text, isInternal: true },
  });
  await writeAdminLog({
    adminUserId,
    action: "SUPPORT_INTERNAL_NOTE",
    targetType: "SUPPORT_TICKET",
    targetId: ticket.ticketNumber,
  });
  return getAdminTicket(ticketNumber);
}

export async function retrySupportEmail(eventId: string, send: SupportSender = defaultSender) {
  const event = await prisma.supportEmailEvent.findUnique({
    where: { id: eventId },
    include: { ticket: { include: { user: true, messages: { orderBy: { createdAt: "asc" } } } } },
  });
  if (!event) throw new Error("NOT_FOUND");
  if (event.status === "SENT") return event;
  const content = rebuildMail(event.eventType, event.ticket, event.messageId);
  if (!content) throw new Error("INVALID_SUPPORT");
  const legacyScope = event.eventKey.split(":").slice(2).join(":") || "-";
  if (event.eventType === "TICKET_CREATED" || event.eventType === "USER_REPLY") {
    await notifyInboxes({
      ticketId: event.ticketId,
      messageId: event.messageId,
      eventType: event.eventType,
      scope: legacyScope.split(":")[0] || legacyScope,
      content,
      send,
    });
    const delivered = await prisma.supportEmailEvent.findFirst({
      where: { ticketId: event.ticketId, eventType: event.eventType, status: "SENT" },
    });
    if (delivered && event.status !== "SENT") {
      return prisma.supportEmailEvent.update({
        where: { id: event.id },
        data: { status: "SENT", lastError: null },
      });
    }
    return prisma.supportEmailEvent.findUnique({ where: { id: event.id } });
  }
  const to = event.eventType === "TICKET_RECEIPT" || event.eventType === "SUPPORT_REPLY" || event.eventType.startsWith("STATUS_")
    ? event.ticket.user.email ?? ""
    : supportInbox();
  return recordAndSend({
    ticketId: event.ticketId,
    messageId: event.messageId,
    eventType: event.eventType,
    scope: legacyScope,
    to,
    content,
    send,
  });
}

function rebuildMail(
  eventType: string,
  ticket: {
    id: string;
    ticketNumber: string;
    subject: string;
    category: keyof typeof CATEGORY_LABEL;
    priority: keyof typeof PRIORITY_LABEL;
    status: SupportStatus;
    context: Prisma.JsonValue;
    createdAt: Date;
    user: { email: string | null; name: string | null };
    messages: Array<{ id: string; content: string; isInternal: boolean }>;
  },
  messageId: string | null,
) {
  if (eventType === "TICKET_RECEIPT") {
    const first = ticket.messages.find((message) => !message.isInternal);
    return ticketCreatedMessage({
      ticketId: ticket.ticketNumber,
      subject: ticket.subject,
      message: (first?.content ?? "").slice(0, 800),
    });
  }
  if (eventType === "TICKET_CREATED") {
    const first = ticket.messages.find((message) => !message.isInternal);
    return newTicketAdminMessage({
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      category: CATEGORY_LABEL[ticket.category],
      priority: PRIORITY_LABEL[ticket.priority],
      userLabel: ticket.user.email || ticket.user.name || "Compte FlyerMint",
      preview: (first?.content ?? "").slice(0, 240),
      contextLines: contextLines(ticket.context),
      adminUrl: adminTicketUrl(ticket.ticketNumber),
      createdAt: formatSupportDate(ticket.createdAt),
    });
  }
  if (eventType === "USER_REPLY") {
    const message = ticket.messages.find((row) => row.id === messageId);
    return userReplyAdminMessage({
      ticketNumber: ticket.ticketNumber,
      preview: (message?.content ?? "").slice(0, 240),
      adminUrl: adminTicketUrl(ticket.ticketNumber),
    });
  }
  if (eventType === "SUPPORT_REPLY") {
    const message = ticket.messages.find((row) => row.id === messageId && !row.isInternal);
    return supportReplyUserMessage({
      ticketNumber: ticket.ticketNumber,
      reply: (message?.content ?? "").slice(0, 800),
      ticketUrl: userTicketUrl(ticket.ticketNumber),
    });
  }
  if (eventType.startsWith("STATUS_")) {
    const status = eventType.slice("STATUS_".length) as SupportStatus;
    if (!(status in STATUS_LABEL)) return null;
    return ticketStatusUserMessage({
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      statusLabel: STATUS_LABEL[status],
      ticketUrl: userTicketUrl(ticket.ticketNumber),
    });
  }
  return null;
}

async function recordAndSend(input: {
  ticketId: string;
  messageId?: string | null;
  eventType: string;
  scope: string;
  to: string;
  content: { subject: string; text: string; html: string };
  send: SupportSender;
}) {
  const eventKey = supportEmailKey(input.eventType, input.ticketId, input.scope);
  let event = await prisma.supportEmailEvent.findUnique({ where: { eventKey } });
  if (event?.status === "SENT") return event;
  if (!event) {
    try {
      event = await prisma.supportEmailEvent.create({
        data: {
          ticketId: input.ticketId,
          messageId: input.messageId ?? null,
          eventType: input.eventType,
          eventKey,
          status: "PENDING",
        },
      });
    } catch (error) {
      if (!isUnique(error)) throw error;
      event = await prisma.supportEmailEvent.findUnique({ where: { eventKey } });
      if (!event || event.status === "SENT") return event;
    }
  }
  const claimed = await prisma.supportEmailEvent.updateMany({
    where: { id: event.id, status: { in: ["PENDING", "FAILED"] }, attempts: event.attempts },
    data: { attempts: { increment: 1 }, status: "PENDING", lastError: null },
  });
  if (claimed.count !== 1) return prisma.supportEmailEvent.findUnique({ where: { id: event.id } });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to)) {
    return prisma.supportEmailEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", lastError: "MAIL_NOT_CONFIGURED" },
    });
  }
  const result = await input.send({ to: input.to, ...input.content });
  return prisma.supportEmailEvent.update({
    where: { id: event.id },
    data: {
      status: result.ok ? "SENT" : "FAILED",
      providerMessageId: result.ok ? result.messageId.slice(0, 180) : null,
      lastError: result.ok ? null : result.error.slice(0, 180),
    },
  });
}

type TicketRow = Prisma.SupportTicketGetPayload<{ include: typeof ticketInclude }>;

function presentUserTicket(ticket: TicketRow) {
  const messages = visibleToUser(ticket.messages);
  return {
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    category: ticket.category,
    categoryLabel: CATEGORY_LABEL[ticket.category],
    priority: ticket.priority,
    priorityLabel: PRIORITY_LABEL[ticket.priority],
    status: ticket.status,
    statusLabel: STATUS_LABEL[ticket.status],
    context: ticket.context,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messages: messages.map((message) => ({
      authorType: message.authorType,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      attachments: message.attachments.map(publicAttachment),
    })),
    attachments: ticket.attachments.map(publicAttachment),
  };
}

function publicAttachment(row: { id: string; fileName: string; mimeType: string; size: number; createdAt: Date; messageId?: string | null }) {
  return {
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    size: row.size,
    createdAt: row.createdAt.toISOString(),
  };
}

function presentAdminTicket(ticket: TicketRow) {
  return {
    ...presentUserTicket({ ...ticket, messages: ticket.messages.filter((message) => !message.isInternal) }),
    userEmail: ticket.user.email,
    userName: ticket.user.name,
    messages: ticket.messages.map((message) => ({
      authorType: message.authorType,
      content: message.content,
      isInternal: message.isInternal,
      createdAt: message.createdAt.toISOString(),
      attachments: message.attachments.map(publicAttachment),
    })),
  };
}
