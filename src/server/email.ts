import { EmailStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { renderEmail, type EmailTemplate } from "@/server/email-templates";
import { emailIdempotencyKey } from "@/lib/support-policy";

export function emailSettings() {
  return {
    from: (process.env.EMAIL_FROM ?? "").trim(),
    replyTo: (process.env.EMAIL_REPLY_TO ?? process.env.SUPPORT_EMAIL ?? "").trim(),
    support: (process.env.SUPPORT_EMAIL ?? "").trim(),
    admin: (process.env.ADMIN_EMAIL ?? "").trim(),
    billing: (process.env.BILLING_EMAIL ?? process.env.SUPPORT_EMAIL ?? "").trim(),
    technical: (process.env.TECHNICAL_EMAIL ?? process.env.SUPPORT_EMAIL ?? "").trim(),
    provider: (process.env.EMAIL_PROVIDER ?? "outbox").trim().toLowerCase(),
    resendKey: (process.env.RESEND_API_KEY ?? "").trim(),
  };
}

export function queueAddressFor(queue: "SUPPORT" | "BILLING" | "TECHNICAL" | "ADMIN") {
  const settings = emailSettings();
  if (queue === "BILLING") return settings.billing || settings.support || settings.admin;
  if (queue === "TECHNICAL") return settings.technical || settings.support || settings.admin;
  if (queue === "ADMIN") return settings.admin || settings.support;
  return settings.support || settings.admin;
}

export async function enqueueEmail(input: {
  template: EmailTemplate;
  to: string;
  entityId: string;
  payload: Record<string, string>;
}) {
  const to = input.to.trim();
  if (!to || !to.includes("@")) return null;
  const key = emailIdempotencyKey(input.template, input.entityId);
  const rendered = renderEmail(input.template, input.payload);
  const existing = await prisma.emailOutbox.findUnique({ where: { idempotencyKey: key } });
  if (existing) return existing;
  return prisma.emailOutbox.create({
    data: {
      idempotencyKey: key,
      template: input.template,
      toAddress: to,
      subject: rendered.subject,
      payload: input.payload as Prisma.InputJsonValue,
      status: EmailStatus.QUEUED,
    },
  });
}

async function deliver(row: { id: string; toAddress: string; subject: string; template: string; payload: Prisma.JsonValue }) {
  const settings = emailSettings();
  const payload = (row.payload ?? {}) as Record<string, string>;
  const rendered = renderEmail(row.template as EmailTemplate, payload);
  if (!settings.from) {
    return { ok: false as const, error: "EMAIL_FROM_MISSING" };
  }
  if (settings.provider === "resend" && settings.resendKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: settings.from,
        to: [row.toAddress],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        reply_to: settings.replyTo || undefined,
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { ok: false as const, error: `EMAIL_HTTP_${response.status}_${detail.slice(0, 180)}` };
    }
    return { ok: true as const };
  }
  // Without a real provider nothing leaves the server, so the row must not claim SENT.
  console.info(`[email:${settings.provider}] SKIPPED ${row.template} -> ${row.toAddress} :: ${rendered.subject}`);
  return { ok: false as const, error: "EMAIL_PROVIDER_NOT_CONFIGURED" };
}

export async function dispatchEmail(id: string) {
  const row = await prisma.emailOutbox.findUnique({ where: { id } });
  if (!row || row.status === EmailStatus.SENT || row.status === EmailStatus.SKIPPED) return row;
  const attempts = row.attempts + 1;
  try {
    const result = await deliver(row);
    if (!result.ok) {
      const missing = result.error === "EMAIL_FROM_MISSING" || result.error === "EMAIL_PROVIDER_NOT_CONFIGURED";
      return prisma.emailOutbox.update({
        where: { id },
        data: {
          attempts,
          status: missing ? EmailStatus.SKIPPED : EmailStatus.FAILED,
          lastError: result.error.slice(0, 240),
          nextAttemptAt: new Date(Date.now() + Math.min(attempts, 6) * 15 * 60 * 1000),
        },
      });
    }
    return prisma.emailOutbox.update({
      where: { id },
      data: { attempts, status: EmailStatus.SENT, sentAt: new Date(), lastError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "EMAIL_FAILED";
    return prisma.emailOutbox.update({
      where: { id },
      data: {
        attempts,
        status: EmailStatus.FAILED,
        lastError: message.slice(0, 240),
        nextAttemptAt: new Date(Date.now() + Math.min(attempts, 6) * 15 * 60 * 1000),
      },
    });
  }
}

export async function enqueueAndSend(input: Parameters<typeof enqueueEmail>[0]) {
  const row = await enqueueEmail(input);
  if (!row) return null;
  if (row.status === EmailStatus.SENT) return row;
  return dispatchEmail(row.id);
}

export async function retryQueuedEmails(limit = 20) {
  const due = await prisma.emailOutbox.findMany({
    where: {
      status: { in: [EmailStatus.QUEUED, EmailStatus.FAILED] },
      attempts: { lt: 5 },
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });
  const results = [];
  for (const row of due) {
    results.push(await dispatchEmail(row.id));
  }
  return results.length;
}
