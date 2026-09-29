import { z } from "zod";

export const SUPPORT_CATEGORIES = [
  "GENERATION",
  "PAYMENT",
  "ACCOUNT",
  "EXPORT",
  "PERSONAL_REFERENCE",
  "BUG",
  "SUGGESTION",
  "OTHER",
] as const;

export const SUPPORT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const SUPPORT_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"] as const;

export const CATEGORY_LABEL: Record<(typeof SUPPORT_CATEGORIES)[number], string> = {
  GENERATION: "Génération",
  PAYMENT: "Paiement / Mints",
  ACCOUNT: "Compte",
  EXPORT: "Export",
  PERSONAL_REFERENCE: "Référence personnelle",
  BUG: "Bug",
  SUGGESTION: "Suggestion",
  OTHER: "Autre",
};

export const PRIORITY_LABEL: Record<(typeof SUPPORT_PRIORITIES)[number], string> = {
  LOW: "Basse",
  MEDIUM: "Normale",
  HIGH: "Haute",
  URGENT: "Urgente",
};

export const STATUS_LABEL: Record<(typeof SUPPORT_STATUSES)[number], string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  WAITING_USER: "En attente",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

export const REPORT_REASONS = [
  { id: "texte", label: "Texte incorrect" },
  { id: "visage", label: "Personne / visage incorrect" },
  { id: "composition", label: "Composition incorrecte" },
  { id: "reference", label: "Référence non respectée" },
  { id: "brief", label: "Résultat différent du brief" },
  { id: "technique", label: "Problème technique" },
  { id: "autre", label: "Autre" },
] as const;

export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 2_000_000;

const categorySchema = z.enum(SUPPORT_CATEGORIES);
const prioritySchema = z.enum(SUPPORT_PRIORITIES);
const statusSchema = z.enum(SUPPORT_STATUSES);

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(140),
  category: categorySchema,
  priority: prioritySchema.optional(),
  message: z.string().trim().min(2).max(4000),
  generationId: z.string().trim().min(1).max(80).optional(),
  paymentId: z.string().trim().min(1).max(80).optional(),
  clientRequestId: z.string().trim().min(8).max(80).optional(),
});

export const userMessageSchema = z.object({
  message: z.string().trim().min(2).max(4000),
});

export const adminReplySchema = z.object({
  message: z.string().trim().min(2).max(4000),
});

export const adminNoteSchema = z.object({
  message: z.string().trim().min(2).max(4000),
});

export const adminPatchSchema = z
  .object({
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
  })
  .refine((value) => value.status || value.priority, { message: "EMPTY" });

export function formatTicketNumber(value: number) {
  return `FM-${String(value).padStart(6, "0")}`;
}

export function supportEmailKey(eventType: string, ticketId: string, scope = "-") {
  return `${eventType}:${ticketId}:${scope}`;
}

const NOTICE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function supportNoticeRecipients(env: {
  ADMIN_EMAIL?: string;
  SUPPORT_EMAIL?: string;
  GMAIL_USER?: string;
}) {
  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const value of [env.ADMIN_EMAIL, env.SUPPORT_EMAIL, env.GMAIL_USER]) {
    const email = value?.trim() ?? "";
    if (!NOTICE_EMAIL.test(email)) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(email);
  }
  return recipients;
}

export function visibleToUser<T extends { isInternal: boolean }>(messages: T[]) {
  return messages.filter((message) => !message.isInternal);
}

export function detectImageMime(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (webp === "WEBP") return "image/webp";
  }
  return null;
}

export function safeFileName(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "capture";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^\.+/, "").slice(0, 80);
  return cleaned || "capture";
}

export function formatSupportDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function reportReasonLabel(id: string | undefined) {
  return REPORT_REASONS.find((reason) => reason.id === id)?.label ?? null;
}

const TEXT_KEYS = ["title", "domain", "subtitle", "description", "date", "time", "location", "cta", "objective", "format", "style"];

function textValue(value: unknown, max = 240) {
  if (typeof value !== "string") return "";
  const clean = value.replace(/[\r\n]+/g, " ").trim();
  if (!clean || clean.startsWith("data:")) return "";
  return clean.slice(0, max);
}

export function publicHttpUrl(value: unknown) {
  const text = textValue(value, 500);
  if (text.startsWith("https://") || text.startsWith("http://")) return text;
  return null;
}

export function generationContext(row: {
  id: string;
  createdAt: Date;
  model: string;
  status: string;
  mintCost: number;
  rodiCost: number | null;
  outputUrl: string | null;
  brief: unknown;
  artDirection: unknown;
  qualityDetails: unknown;
}) {
  const brief = row.brief && typeof row.brief === "object" ? (row.brief as Record<string, unknown>) : {};
  const picked: Record<string, string> = {};
  for (const key of TEXT_KEYS) {
    const value = textValue(brief[key]);
    if (value) picked[key] = value;
  }
  const art = row.artDirection && typeof row.artDirection === "object" ? (row.artDirection as Record<string, unknown>) : {};
  const artPicked: Record<string, string> = {};
  for (const [key, value] of Object.entries(art)) {
    if (artPicked && Object.keys(artPicked).length >= 8) break;
    const text = textValue(value, 180);
    if (text) artPicked[key] = text;
  }
  const quality = row.qualityDetails && typeof row.qualityDetails === "object" ? (row.qualityDetails as Record<string, unknown>) : {};
  const error = textValue(quality.error) || textValue(quality.failure) || (row.status === "FAILED" ? "Génération échouée" : "");
  return {
    generationId: row.id,
    createdAt: row.createdAt.toISOString(),
    model: row.model,
    status: row.status,
    mintCost: row.mintCost,
    rodiCost: row.rodiCost,
    hasOutput: Boolean(row.outputUrl),
    outputUrl: publicHttpUrl(row.outputUrl),
    brief: picked,
    artDirection: artPicked,
    error: error || null,
  };
}

export function paymentContext(row: {
  id: string;
  orderId: string;
  amountFcfa: number;
  status: string;
  createdAt: Date;
  plan: { code: string; name: string; mintAmount: number };
}) {
  return {
    paymentId: row.id,
    orderId: row.orderId,
    amountFcfa: row.amountFcfa,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    planCode: row.plan.code,
    planName: row.plan.name,
    mintAmount: row.plan.mintAmount,
  };
}
