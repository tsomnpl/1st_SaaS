import "server-only";
import { createTransport } from "nodemailer";
import { emailsMatch, getConfiguredAdminEmail } from "@/lib/admin";
import { getAppUrl } from "@/lib/env";
import {
  generationFailedMessage,
  generationSucceededMessage,
  importantNoticeMessage,
  paymentConfirmedMessage,
  paymentFailedMessage,
  supportReplyMessage,
  ticketCreatedMessage,
  ticketResolvedMessage,
  type GenerationMail,
  type PaymentMail,
  type TicketMail,
} from "@/server/mail-messages";

export type MailResult = { ok: true; messageId: string } | { ok: false; error: string };

type Outbound = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const RECIPIENT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function gmailSmtpSettings(user: string, password: string) {
  return {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user,
      pass: password,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    logger: false,
    debug: false,
  };
}

export async function verifyMailTransport(): Promise<MailResult> {
  const config = readMailConfig();
  if (!config) return { ok: false, error: "MAIL_NOT_CONFIGURED" };
  try {
    const transport = createTransport(gmailSmtpSettings(config.user, config.password));
    await transport.verify();
    return { ok: true, messageId: "" };
  } catch (error) {
    return fail(error, config.password);
  }
}

export function sendTicketCreated(input: TicketMail & { to: string }) {
  return deliver(input.to, ticketCreatedMessage(input));
}

export function sendSupportReply(input: TicketMail & { to: string }) {
  return deliver(input.to, supportReplyMessage(input));
}

export function sendTicketResolved(input: TicketMail & { to: string }) {
  return deliver(input.to, ticketResolvedMessage(input));
}

export function sendPaymentConfirmed(input: Omit<PaymentMail, "appUrl"> & { to: string; appUrl?: string }) {
  return deliver(input.to, paymentConfirmedMessage({ ...input, appUrl: input.appUrl ?? getAppUrl() }));
}

export function sendPaymentFailed(input: Omit<PaymentMail, "appUrl"> & { to: string; appUrl?: string }) {
  return deliver(input.to, paymentFailedMessage({ ...input, appUrl: input.appUrl ?? getAppUrl() }));
}

export function sendGenerationSucceeded(input: Omit<GenerationMail, "appUrl"> & { to: string; appUrl?: string }) {
  return deliver(input.to, generationSucceededMessage({ ...input, appUrl: input.appUrl ?? getAppUrl() }));
}

export function sendGenerationFailed(input: Omit<GenerationMail, "appUrl"> & { to: string; appUrl?: string }) {
  return deliver(input.to, generationFailedMessage({ ...input, appUrl: input.appUrl ?? getAppUrl() }));
}

export function sendImportantNotice(input: { to: string; subject: string; text: string }) {
  return deliver(input.to, importantNoticeMessage(input.subject, input.text));
}

export async function notifyAdmin(subject: string, text: string, userEmail?: string | null) {
  const admin = getConfiguredAdminEmail();
  if (!admin || (userEmail && emailsMatch(admin, userEmail))) {
    return { ok: false, error: "MAIL_ADMIN_SKIPPED" } satisfies MailResult;
  }
  return sendImportantNotice({ to: admin, subject, text });
}

async function deliver(to: string, content: { subject: string; text: string; html: string }): Promise<MailResult> {
  const config = readMailConfig();
  if (!config) return { ok: false, error: "MAIL_NOT_CONFIGURED" };
  if (!RECIPIENT.test(to)) return { ok: false, error: "MAIL_RECIPIENT_INVALID" };
  const message: Outbound = { to, ...content };
  try {
    const transport = createTransport(gmailSmtpSettings(config.user, config.password));
    const info = await transport.sendMail({
      from: formatFrom(config.fromName, config.user),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { ok: true, messageId: info.messageId ?? "" };
  } catch (error) {
    return fail(error, config.password);
  }
}

function readMailConfig() {
  const user = serverEnv("GMAIL_USER");
  const password = serverEnv("GMAIL_APP_PASSWORD").replace(/\s+/g, "");
  const fromName = serverEnv("EMAIL_FROM_NAME") || "FlyerMint";
  if (!user || !password) return null;
  return { user, password, fromName };
}

function serverEnv(name: string) {
  const source = process.env;
  const value = source[name];
  return typeof value === "string" ? value.trim() : "";
}

function formatFrom(name: string, user: string) {
  const safeName = name.replace(/[\r\n"<>]/g, "").trim() || "FlyerMint";
  return `${safeName} <${user}>`;
}

function fail(error: unknown, password: string): MailResult {
  const safe = redactMailError(error, password);
  console.error(`mail_send_failed ${safe}`);
  return { ok: false, error: safe };
}

export function redactMailError(error: unknown, password: string) {
  const message = error instanceof Error ? error.message : "MAIL_SEND_FAILED";
  const code = readErrorField(error, "code");
  const responseCode = readErrorField(error, "responseCode");
  let cleaned = message;
  if (password) cleaned = cleaned.split(password).join("");
  cleaned = cleaned.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]");
  cleaned = cleaned.replace(/\s+/g, " ").trim().slice(0, 160);
  if (!cleaned || cleaned.toLowerCase().includes("pass")) {
    return code || "MAIL_SEND_FAILED";
  }
  return [code || "MAIL_SEND_FAILED", responseCode, cleaned].filter(Boolean).join(" ");
}

function readErrorField(error: unknown, field: string) {
  if (!error || typeof error !== "object" || !(field in error)) return "";
  const value = (error as Record<string, unknown>)[field];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
