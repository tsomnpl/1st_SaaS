export type TicketMail = {
  ticketId: string;
  subject: string;
  message: string;
  reply?: string;
};

export type PaymentMail = {
  orderId: string;
  planName: string;
  amountFcfa: number;
  mintAmount: number;
  appUrl: string;
};

export type GenerationMail = {
  title: string;
  generationId: string;
  appUrl: string;
};

export type MailContent = {
  subject: string;
  text: string;
  html: string;
};

export function ticketCreatedMessage(input: TicketMail): MailContent {
  return message(
    `Ticket reçu, ${input.ticketId}`,
    [
      "Nous avons bien reçu ton message.",
      `Référence : ${input.ticketId}`,
      `Sujet : ${input.subject}`,
      input.message,
      "Nous répondons sur cette adresse.",
    ],
  );
}

export function supportReplyMessage(input: TicketMail): MailContent {
  return message(
    `Réponse du support, ${input.ticketId}`,
    [
      `Référence : ${input.ticketId}`,
      `Sujet : ${input.subject}`,
      "Réponse :",
      input.reply ?? "",
    ],
  );
}

export function ticketResolvedMessage(input: TicketMail): MailContent {
  return message(
    `Ticket résolu, ${input.ticketId}`,
    [
      `Ton ticket ${input.ticketId} est marqué résolu.`,
      `Sujet : ${input.subject}`,
    ],
  );
}

export function paymentConfirmedMessage(input: PaymentMail): MailContent {
  return message(
    `Paiement confirmé, ${input.orderId}`,
    [
      "Paiement confirmé.",
      `Commande : ${input.orderId}`,
      `Offre : ${input.planName}`,
      `Montant : ${input.amountFcfa} FCFA`,
      `Mints ajoutés : ${input.mintAmount}`,
      `Ton espace : ${input.appUrl}/dashboard`,
    ],
  );
}

export function paymentFailedMessage(input: PaymentMail): MailContent {
  return message(
    `Paiement non abouti, ${input.orderId}`,
    [
      "Le paiement n’a pas abouti. Aucun Mint n’a été ajouté.",
      `Commande : ${input.orderId}`,
      `Offre : ${input.planName}`,
      `Montant : ${input.amountFcfa} FCFA`,
      `Réessayer : ${input.appUrl}/pricing`,
    ],
  );
}

export function generationSucceededMessage(input: GenerationMail): MailContent {
  return message(
    "Ton affiche est prête",
    [
      `L’affiche « ${input.title} » est prête.`,
      `Référence : ${input.generationId}`,
      `Historique : ${input.appUrl}/history`,
    ],
  );
}

export function generationFailedMessage(input: GenerationMail): MailContent {
  return message(
    "Génération non aboutie",
    [
      `La génération de « ${input.title} » n’a pas abouti.`,
      "Le Mint utilisé a été recrédité.",
      `Référence : ${input.generationId}`,
      `Réessayer : ${input.appUrl}/create`,
    ],
  );
}

export function newTicketAdminMessage(input: {
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  userLabel: string;
  preview: string;
  contextLines: string[];
  adminUrl: string | null;
  createdAt: string;
}): MailContent {
  return message(`[Nouveau ticket] #${input.ticketNumber}, ${input.category}`, [
    `Ticket #${input.ticketNumber}`,
    `Sujet : ${input.subject}`,
    `Catégorie : ${input.category}`,
    `Priorité : ${input.priority}`,
    `Utilisateur : ${input.userLabel}`,
    `Date : ${input.createdAt}`,
    `Message : ${input.preview}`,
    ...input.contextLines,
    input.adminUrl ? `Ouvrir le ticket : ${input.adminUrl}` : "Le chemin du studio admin n’est pas configuré.",
  ]);
}

export function userReplyAdminMessage(input: {
  ticketNumber: string;
  preview: string;
  adminUrl: string | null;
}): MailContent {
  return message(`[Réponse ticket] #${input.ticketNumber}`, [
    `Nouvelle réponse sur le ticket #${input.ticketNumber}.`,
    input.preview,
    input.adminUrl ? `Ouvrir le ticket : ${input.adminUrl}` : "Le chemin du studio admin n’est pas configuré.",
  ]);
}

export function supportReplyUserMessage(input: {
  ticketNumber: string;
  reply: string;
  ticketUrl: string;
}): MailContent {
  return message(`[FlyerMint Support] Réponse à #${input.ticketNumber}`, [
    `Le support a répondu au ticket #${input.ticketNumber}.`,
    input.reply,
    `Voir la réponse : ${input.ticketUrl}`,
  ]);
}

export function ticketStatusUserMessage(input: {
  ticketNumber: string;
  subject: string;
  statusLabel: string;
  ticketUrl: string;
}): MailContent {
  return message(`[FlyerMint Support] Ticket #${input.ticketNumber}, ${input.statusLabel}`, [
    `Ton ticket #${input.ticketNumber} est maintenant : ${input.statusLabel}.`,
    `Sujet : ${input.subject}`,
    `Voir le ticket : ${input.ticketUrl}`,
  ]);
}

export function importantNoticeMessage(subject: string, text: string): MailContent {
  return message(subject, [text]);
}

function message(subject: string, lines: string[]): MailContent {
  const cleanSubject = oneLine(subject);
  const cleanLines = lines.map((line) => line.replace(/[\r\n]+/g, " ").trim()).filter(Boolean);
  const text = [...cleanLines, "", "FlyerMint"].join("\n");
  const html = [
    `<div style="font-family:Arial,sans-serif;color:#1E293B;line-height:1.5">`,
    ...cleanLines.map((line) => `<p>${escapeHtml(line)}</p>`),
    `<p>FlyerMint</p>`,
    `</div>`,
  ].join("");
  return { subject: cleanSubject, text, html };
}

function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
