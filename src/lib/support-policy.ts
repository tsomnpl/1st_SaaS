import type { TicketCategory, TicketPriority, SupportQueue } from "@prisma/client";

export const TICKET_STATUSES = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"] as const;
export const TICKET_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const TICKET_CATEGORIES = [
  "GENERATION",
  "PAYMENT",
  "MINTS",
  "ACCOUNT",
  "EXPORT",
  "PERSONAL_REFERENCE",
  "BUG",
  "FEATURE_REQUEST",
  "OTHER",
] as const;

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  GENERATION: "Génération",
  PAYMENT: "Paiement",
  MINTS: "Mints",
  ACCOUNT: "Compte",
  EXPORT: "Export",
  PERSONAL_REFERENCE: "Référence personnelle",
  BUG: "Bug",
  FEATURE_REQUEST: "Suggestion",
  OTHER: "Autre",
};

export const STATUS_LABEL: Record<(typeof TICKET_STATUSES)[number], string> = {
  NEW: "Nouveau",
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  WAITING_USER: "En attente de toi",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  URGENT: "Urgente",
};

const MAX_ATTACHMENT_BYTES = 2_000_000;

export function queueForCategory(category: TicketCategory): SupportQueue {
  if (category === "PAYMENT" || category === "MINTS") return "BILLING";
  if (category === "GENERATION" || category === "EXPORT" || category === "PERSONAL_REFERENCE" || category === "BUG") {
    return "TECHNICAL";
  }
  if (category === "ACCOUNT") return "SUPPORT";
  return "SUPPORT";
}

export function classifySupportText(text: string): {
  category: TicketCategory;
  priority: TicketPriority;
  queue: SupportQueue;
} {
  const t = text.toLowerCase();
  const paidNoMints = /pay[ée]|paiement|fcfa|money fusion/.test(t) && /mint|cr[ée]dit|pas re[çc]u|n['’]ai pas/.test(t);
  if (paidNoMints) return { category: "MINTS", priority: "HIGH", queue: "BILLING" };
  if (/r[ée]f[ée]rence personnelle|photo de r[ée]f[ée]rence/.test(t)) {
    return { category: "PERSONAL_REFERENCE", priority: "NORMAL", queue: "TECHNICAL" };
  }
  if (/export|pack [ée]ditable/.test(t)) return { category: "EXPORT", priority: "NORMAL", queue: "TECHNICAL" };
  if (/g[ée]n[ée]r|affiche|rodium|image/.test(t)) return { category: "GENERATION", priority: "NORMAL", queue: "TECHNICAL" };
  if (/paiement|payer|facture/.test(t)) return { category: "PAYMENT", priority: "HIGH", queue: "BILLING" };
  if (/mint/.test(t)) return { category: "MINTS", priority: "NORMAL", queue: "BILLING" };
  if (/compte|connexion|clerk|mot de passe/.test(t)) return { category: "ACCOUNT", priority: "NORMAL", queue: "SUPPORT" };
  if (/bug|erreur|plante/.test(t)) return { category: "BUG", priority: "HIGH", queue: "TECHNICAL" };
  if (/id[ée]e|am[ée]lior|suggestion/.test(t)) return { category: "FEATURE_REQUEST", priority: "LOW", queue: "SUPPORT" };
  return { category: "OTHER", priority: "NORMAL", queue: "SUPPORT" };
}

export function resolveTicketClassification(input: {
  subject: string;
  description: string;
  category?: TicketCategory | null;
  priority?: TicketPriority | null;
}) {
  const detected = classifySupportText(`${input.subject}\n${input.description}`);
  const category = input.category && input.category !== "OTHER" ? input.category : detected.category;
  const priority =
    input.priority && input.priority !== "NORMAL"
      ? input.priority
      : detected.priority === "HIGH" || detected.priority === "URGENT"
        ? detected.priority
        : input.priority ?? detected.priority;
  return { category, priority, queue: queueForCategory(category) };
}

export function formatSequenceId(prefix: "FM" | "INC", year: number, sequence: number) {
  return `${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}

export function subjectsLookSimilar(left: string, right: string) {
  const norm = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const a = norm(left);
  const b = norm(right);
  return a.length >= 8 && a === b;
}

export function canReadTicket(input: { actorId: string; ownerId: string; isAdmin: boolean }) {
  return input.isAdmin || input.actorId === input.ownerId;
}

export function assertTicketAccess(input: { actorId: string; ownerId: string; isAdmin: boolean }) {
  if (!canReadTicket(input)) throw new Error("FORBIDDEN");
}

export function publicTicketView<T extends { messages?: Array<{ visibility: string }>; contextInternal?: unknown }>(ticket: T) {
  const rest = { ...ticket };
  delete rest.contextInternal;
  return {
    ...rest,
    messages: (ticket.messages ?? []).filter((message) => message.visibility === "PUBLIC"),
  };
}

export function stripSensitiveBrief(brief: unknown) {
  if (!brief || typeof brief !== "object") return {};
  const source = brief as Record<string, unknown>;
  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === "mainImageUrl" || key === "logoUrl") {
      clone[key === "mainImageUrl" ? "clientImageAttached" : "logoAttached"] = typeof value === "string" && value.length > 0;
      continue;
    }
    if (typeof value === "string" && value.startsWith("data:")) continue;
    clone[key] = value;
  }
  return clone;
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export function detectAllowedMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  return null;
}

export function validateAttachment(input: { bytes: Uint8Array; fileName: string }) {
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new Error("ATTACHMENT_REJECTED");
  }
  const mime = detectAllowedMime(input.bytes);
  if (!mime || !ALLOWED_MIME.has(mime)) throw new Error("ATTACHMENT_REJECTED");
  const base = input.fileName.split(/[/\\]/).pop() ?? "fichier";
  const safe = base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "fichier";
  if (/\.(svg|html?|exe|js|mjs|sh|php)$/i.test(safe)) throw new Error("ATTACHMENT_REJECTED");
  return { mime, fileName: safe, sizeBytes: input.bytes.byteLength };
}

export function safeStorageKey(ticketId: string, fileName: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(ticketId)) throw new Error("ATTACHMENT_REJECTED");
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    throw new Error("ATTACHMENT_REJECTED");
  }
  return `${ticketId}/${fileName}`;
}

const REFUND_PROMISE = /je (te |vous )?(rembourse|cr[ée]dite|ajoute)/i;

export function answerSupportQuestion(input: { message: string; mintBalance: number | null }) {
  const text = input.message.trim();
  const lower = text.toLowerCase();
  if (!text) {
    return {
      reply: "Pose une question sur les Mints, les affiches, les paiements ou l’export.",
      escalate: false,
    };
  }
  if (REFUND_PROMISE.test(text)) {
    return {
      reply: "Je ne peux pas promettre un remboursement ni modifier un solde.",
      escalate: true,
    };
  }
  if (/rembours|rec[ée]diter|ajoute[rz]? des mints|cr[ée]dite/.test(lower)) {
    return {
      reply:
        "Je ne modifie jamais un solde et je ne confirme pas un remboursement. Si une génération échoue, le ledger existant rembourse le Mint uniquement quand l’échec est enregistré. Pour un paiement, la preuve vient du webhook et des transactions, pas de cet assistant. Tu peux transférer la demande au support.",
      escalate: true,
    };
  }
  if (/cl[ée] api|prompt syst[èe]me|secret|mot de passe admin/.test(lower)) {
    return {
      reply: "Je ne peux pas afficher de clés, de prompts internes ou de journaux techniques.",
      escalate: false,
    };
  }
  if (/mint/.test(lower)) {
    const balance =
      input.mintBalance === null ? "Ton solde se lit dans le tableau de bord." : `Ton solde actuel est de ${input.mintBalance} Mint${input.mintBalance > 1 ? "s" : ""}.`;
    return {
      reply: `1 Mint = 1 génération. Une régénération coûte 1 Mint de plus. L’export ne coûte rien. L’inscription offre 1 Mint. ${balance} Le solde affiché ici vient du compte, pas d’une estimation.`,
      escalate: false,
    };
  }
  if (/r[ée]f[ée]rence personnelle/.test(lower)) {
    return {
      reply:
        "Les références internes FlyerMint restent disponibles pour tous les plans. La référence personnelle est réservée aux packs 20 000 et 25 000 FCFA, uniquement pour la génération concernée. Elle ne devient jamais une référence globale et ne coûte pas de Mint supplémentaire. Sans référence personnelle, ces packs fonctionnent comme les autres.",
      escalate: false,
    };
  }
  if (/export/.test(lower)) {
    return {
      reply: "L’export ne consomme pas de Mint. Le pack éditable dépend de l’offre payée (packs qui l’incluent).",
      escalate: false,
    };
  }
  if (/paiement|pay[ée]/.test(lower)) {
    return {
      reply:
        "Un paiement n’est confirmé qu’après vérification serveur (Money Fusion, webhook, transaction). Le retour navigateur ne suffit pas. Je ne peux pas valider un paiement depuis cette conversation.",
      escalate: true,
    };
  }
  if (/g[ée]n[ée]r|affiche/.test(lower)) {
    return {
      reply:
        "Une génération consomme 1 Mint au démarrage. Si elle échoue, le remboursement prévu par le ledger est réappliqué. Tu peux signaler un problème depuis l’historique : le ticket reprend le contexte de la génération.",
      escalate: false,
    };
  }
  return {
    reply:
      "Je n’ai pas une réponse certaine. Transfère la demande au support : un ticket sera créé, sans modifier tes Mints ni tes paiements.",
    escalate: true,
  };
}

export function failureRateMetric(input: { completed: number; failed: number; minSample: number }) {
  const total = input.completed + input.failed;
  if (total < input.minSample) return { sufficient: false as const, rate: null };
  return { sufficient: true as const, rate: input.failed / total };
}

export function emailIdempotencyKey(template: string, entityId: string) {
  return `${template}:${entityId}`;
}

export function attachmentRetentionNote() {
  return "Les pièces jointes de support restent privées, liées au ticket, et suivent la durée de vie du compte dans la base hébergée. Elles ne sont pas publiées.";
}
