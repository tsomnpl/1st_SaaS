import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  addAdminReply,
  addInternalNote,
  addSupportAttachment,
  addUserMessage,
  createSupportTicket,
  getAdminTicket,
  getUserTicket,
  patchAdminTicket,
  readSupportAttachment,
  retrySupportEmail,
  type SupportSender,
} from "@/server/support";

const prisma = new PrismaClient();
const stamp = `${Date.now()}`;
const clerkA = `it_support_a_${stamp}`;
const clerkB = `it_support_b_${stamp}`;
const clerkAdmin = `it_support_admin_${stamp}`;

describe.sequential("support tickets", () => {
  const previousEnv = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    GMAIL_USER: process.env.GMAIL_USER,
  };
  process.env.ADMIN_EMAIL = "desk@example.com";
  process.env.SUPPORT_EMAIL = "";
  process.env.GMAIL_USER = "";
  const sent: string[] = [];
  let failNext = false;
  const send: SupportSender = async (input) => {
    if (failNext) {
      failNext = false;
      return { ok: false, error: "SMTP_DOWN" };
    }
    sent.push(`${input.to}|${input.subject}|${input.text}`);
    return { ok: true, messageId: `msg-${sent.length}` };
  };
  let userA = "";
  let userB = "";
  let adminId = "";
  let ticketNumber = "";
  let attachmentId = "";

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { clerkUserId: { in: [clerkA, clerkB, clerkAdmin] } },
      select: { id: true },
    });
    const ids = users.map((user) => user.id);
    if (ids.length) {
      await prisma.adminLog.deleteMany({ where: { adminUserId: { in: ids } } });
      await prisma.supportTicket.deleteMany({ where: { userId: { in: ids } } });
      await prisma.generation.deleteMany({ where: { userId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
    process.env.ADMIN_EMAIL = previousEnv.ADMIN_EMAIL;
    process.env.SUPPORT_EMAIL = previousEnv.SUPPORT_EMAIL;
    process.env.GMAIL_USER = previousEnv.GMAIL_USER;
  });

  it("stores the ticket before email and ignores a repeated request", async () => {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { code: "STARTER_2K" } });
    const user = await prisma.user.create({ data: { clerkUserId: clerkA, email: `a-${stamp}@example.com`, name: "A" } });
    const other = await prisma.user.create({ data: { clerkUserId: clerkB, email: `b-${stamp}@example.com` } });
    const admin = await prisma.user.create({ data: { clerkUserId: clerkAdmin, email: `admin-${stamp}@example.com`, role: "ADMIN" } });
    userA = user.id;
    userB = other.id;
    adminId = admin.id;
    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        brief: { title: "Soirée", personalReferenceUrl: "data:image/png;base64,aaaa" },
        artDirection: { palette: "violet" },
        prompt: "prompt",
        model: "google/gemini-3-pro-image",
        status: "FAILED",
        outputUrl: "data:image/png;base64,bbbb",
      },
    });
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        orderId: `FM-SUP-${stamp}`,
        tokenPay: `tok-sup-${stamp}`,
        amountFcfa: plan.priceFcfa,
        status: "PENDING",
      },
    });
    const first = await createSupportTicket(
      {
        subject: "Paiement non crédité",
        category: "PAYMENT",
        priority: "HIGH",
        message: "J'ai payé mais les Mints ne sont pas arrivés.",
        generationId: generation.id,
        paymentId: payment.id,
        clientRequestId: `req-${stamp}`,
      },
      user.id,
      send,
    );
    const second = await createSupportTicket(
      {
        subject: "Paiement non crédité",
        category: "PAYMENT",
        message: "Doublon",
        clientRequestId: `req-${stamp}`,
      },
      user.id,
      send,
    );
    ticketNumber = first.ticketNumber;
    expect(first.ticketNumber).toMatch(/^FM-\d{6}$/);
    expect(second.ticketNumber).toBe(first.ticketNumber);
    const adminNotice = sent.find((row) => row.startsWith("desk@example.com|") && row.includes("[Nouveau ticket]"));
    const receipt = sent.find((row) => row.startsWith(`a-${stamp}@example.com|`));
    expect(adminNotice).toContain(first.ticketNumber);
    expect(receipt).toContain("Nous avons bien reçu");
    expect(receipt).toContain(first.ticketNumber);
    expect(sent[0]?.includes("tok-sup")).toBe(false);
    expect(JSON.stringify(first.context).includes("base64")).toBe(false);
    expect(JSON.stringify(first.context).includes(payment.orderId)).toBe(true);
    const stored = await prisma.supportTicket.findUniqueOrThrow({ where: { ticketNumber } });
    expect(stored.userId).toBe(user.id);
  });

  it("refuses another user and hides internal notes", async () => {
    await expect(getUserTicket(userB, ticketNumber)).rejects.toThrow("NOT_FOUND");
    await addInternalNote(adminId, ticketNumber, "Vérifier le webhook avant un crédit manuel.");
    const userView = await getUserTicket(userA, ticketNumber);
    const adminView = await getAdminTicket(ticketNumber);
    expect(userView.messages.some((message) => message.content.includes("webhook"))).toBe(false);
    expect(adminView.messages.some((message) => message.isInternal && message.content.includes("webhook"))).toBe(true);
  });

  it("keeps the message when mail fails, then retries once", async () => {
    failNext = true;
    await addUserMessage(userA, ticketNumber, "Je confirme le paiement.", send);
    const failed = await prisma.supportEmailEvent.findFirst({
      where: { eventType: "USER_REPLY", ticket: { ticketNumber } },
    });
    expect(failed?.status).toBe("FAILED");
    const before = sent.length;
    await retrySupportEmail(failed!.id, send);
    expect(sent.length).toBe(before + 1);
    await retrySupportEmail(failed!.id, send);
    expect(sent.length).toBe(before + 1);
    const message = await prisma.supportMessage.findFirst({
      where: { ticket: { ticketNumber }, content: "Je confirme le paiement." },
    });
    expect(message).toBeTruthy();
  });

  it("stores a private image and blocks the other user", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
    const saved = await addSupportAttachment({
      userId: userA,
      ticketNumber,
      fileName: "../capture finale.png",
      declaredMime: "image/png",
      bytes: png,
    });
    attachmentId = saved.id;
    expect(saved.fileName).toBe("capture-finale.png");
    const own = await readSupportAttachment({ attachmentId, userId: userA, asAdmin: false });
    expect(own.bytes[0]).toBe(0x89);
    await expect(readSupportAttachment({ attachmentId, userId: userB, asAdmin: false })).rejects.toThrow("NOT_FOUND");
    await expect(
      addSupportAttachment({
        userId: userA,
        ticketNumber,
        fileName: "note.pdf",
        declaredMime: "application/pdf",
        bytes: Buffer.from("%PDF-1.4 contenu assez long"),
      }),
    ).rejects.toThrow("INVALID_ATTACHMENT");
  });

  it("emails the user on a support reply and not on an internal note", async () => {
    const before = sent.length;
    await addAdminReply(adminId, ticketNumber, "Nous vérifions le paiement.", send);
    expect(sent.length).toBe(before + 1);
    expect(sent.at(-1)).toContain("Réponse");
    expect(sent.at(-1)).toContain(`/support/${ticketNumber}`);
    await addInternalNote(adminId, ticketNumber, "Toujours interne.");
    expect(sent.length).toBe(before + 1);
    const userView = await getUserTicket(userA, ticketNumber);
    expect(userView.messages.some((message) => message.content.includes("Toujours interne"))).toBe(false);
    expect(userView.status).toBe("IN_PROGRESS");
  });

  it("notifies a status change once", async () => {
    const before = sent.length;
    await patchAdminTicket(adminId, ticketNumber, { status: "RESOLVED" }, send);
    await patchAdminTicket(adminId, ticketNumber, { status: "RESOLVED" }, send);
    expect(sent.length).toBe(before + 1);
    expect(sent.at(-1)).toContain("Résolu");
    const ticket = await prisma.supportTicket.findUniqueOrThrow({ where: { ticketNumber } });
    expect(ticket.resolvedAt).toBeTruthy();
  });
});
