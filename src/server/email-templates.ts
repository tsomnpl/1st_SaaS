import { getAppUrl } from "@/lib/env";
import { whatsappLink } from "@/lib/support-policy";

export type EmailTemplate =
  | "TicketCreated"
  | "TicketReply"
  | "TicketResolved"
  | "TicketClosed"
  | "PaymentSuccess"
  | "PaymentFailed"
  | "GenerationSuccess"
  | "GenerationFailed"
  | "MintExpiring"
  | "IncidentNotification"
  | "AdminAlert"
  | "Welcome";

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

function layout(input: { title: string; body: string; ctaLabel?: string; ctaUrl?: string; ticketId?: string }) {
  const app = getAppUrl();
  const cta = input.ctaLabel && input.ctaUrl
    ? `<p style="margin:24px 0"><a href="${input.ctaUrl}" style="background:#6D28D9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">${input.ctaLabel}</a></p>`
    : "";
  const ticket = input.ticketId ? `<p style="color:#6D28D9;font-weight:700">Ticket ${input.ticketId}</p>` : "";
  const whatsapp = whatsappLink(process.env.SUPPORT_WHATSAPP_NUMBER);
  const whatsappLine = whatsapp ? `<br/>WhatsApp support : <a href="${whatsapp}" style="color:#6D28D9">${whatsapp.replace("https://", "")}</a>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f7f8fb;color:#1E293B;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
  <table width="560" style="background:#fff;border-radius:20px;padding:28px">
  <tr><td>
  <p style="margin:0;font-weight:800;letter-spacing:.08em;color:#6D28D9">FLYERMINT</p>
  <h1 style="font-size:22px;margin:16px 0 8px">${input.title}</h1>
  ${ticket}
  <div style="font-size:15px;line-height:1.5">${input.body}</div>
  ${cta}
  <p style="margin-top:28px;font-size:12px;color:#64748b">FlyerMint — ${app}${whatsappLine}<br/>Cet e-mail ne contient ni clé, ni prompt interne, ni journal technique.</p>
  </td></tr></table></td></tr></table></body></html>`;
  const text = [input.title, input.ticketId ? `Ticket ${input.ticketId}` : "", input.body.replace(/<[^>]+>/g, " "), input.ctaUrl ?? "", whatsapp ? `WhatsApp support : ${whatsapp}` : ""]
    .filter(Boolean)
    .join("\n");
  return { html, text };
}

export function renderEmail(template: EmailTemplate, payload: Record<string, string>): EmailContent {
  const app = getAppUrl();
  const ticketUrl = payload.publicId ? `${app}/support/${payload.ticketRef ?? ""}` : `${app}/support`;
  switch (template) {
    case "TicketCreated":
      return {
        subject: `Demande reçue ${payload.publicId ?? ""}`.trim(),
        ...layout({
          title: "Nous avons bien reçu ta demande.",
          ticketId: payload.publicId,
          body: `<p>Catégorie : ${payload.categoryLabel ?? "Support"}.</p><p>Statut : Nouveau.</p><p>${payload.summary ?? ""}</p>`,
          ctaLabel: "Voir la demande",
          ctaUrl: payload.href || ticketUrl,
        }),
      };
    case "TicketReply":
      return {
        subject: `Réponse du support ${payload.publicId ?? ""}`.trim(),
        ...layout({
          title: "Le support a répondu.",
          ticketId: payload.publicId,
          body: `<p>${payload.summary ?? "Une nouvelle réponse est disponible dans ton centre d’aide."}</p>`,
          ctaLabel: "Lire la réponse",
          ctaUrl: payload.href || `${app}/support`,
        }),
      };
    case "TicketResolved":
      return {
        subject: `Ticket résolu ${payload.publicId ?? ""}`.trim(),
        ...layout({
          title: "Ta demande est résolue.",
          ticketId: payload.publicId,
          body: payload.askCsat
            ? "<p>Tu peux la rouvrir en répondant si quelque chose manque.</p><p>Note ton expérience de 1 à 5 sur la page du ticket (une seule fois, 10 secondes).</p>"
            : "<p>Tu peux la rouvrir en répondant si quelque chose manque.</p>",
          ctaLabel: payload.askCsat ? "Noter le support" : "Voir le ticket",
          ctaUrl: payload.href || `${app}/support`,
        }),
      };
    case "TicketClosed":
      return {
        subject: `Ticket fermé ${payload.publicId ?? ""}`.trim(),
        ...layout({
          title: "Ta demande est fermée.",
          ticketId: payload.publicId,
          body: "<p>Merci d’avoir écrit à FlyerMint.</p>",
          ctaLabel: "Centre d’aide",
          ctaUrl: `${app}/support`,
        }),
      };
    case "PaymentSuccess":
      return {
        subject: "Paiement confirmé",
        ...layout({
          title: "Ton paiement est confirmé.",
          body: `<p>${payload.summary ?? "Les Mints associés ont été crédités selon l’offre."}</p>`,
          ctaLabel: "Voir mon solde",
          ctaUrl: `${app}/dashboard`,
        }),
      };
    case "PaymentFailed":
      return {
        subject: "Paiement non confirmé",
        ...layout({
          title: "Le paiement n’a pas été confirmé.",
          body: "<p>Aucun Mint n’est ajouté tant que le serveur n’a pas validé le paiement.</p>",
          ctaLabel: "Réessayer",
          ctaUrl: `${app}/pricing`,
        }),
      };
    case "GenerationSuccess":
      return {
        subject: "Ton affiche est prête",
        ...layout({
          title: "La génération est terminée.",
          body: `<p>${payload.summary ?? "Ton affiche est disponible dans l’historique."}</p>`,
          ctaLabel: "Voir l’historique",
          ctaUrl: `${app}/history`,
        }),
      };
    case "GenerationFailed":
      return {
        subject: "Génération non aboutie",
        ...layout({
          title: "La génération n’a pas abouti.",
          body: "<p>Si l’échec est enregistré, le Mint est recrédité par le ledger existant. Tu peux signaler le problème depuis l’historique.</p>",
          ctaLabel: "Historique",
          ctaUrl: `${app}/history`,
        }),
      };
    case "MintExpiring":
      return {
        subject: "Des Mints arrivent à expiration",
        ...layout({
          title: "Certains Mints expirent bientôt.",
          body: `<p>${payload.summary ?? "Consulte ton solde pour les utiliser avant expiration."}</p>`,
          ctaLabel: "Tableau de bord",
          ctaUrl: `${app}/dashboard`,
        }),
      };
    case "IncidentNotification":
    case "AdminAlert":
      return {
        subject: payload.subject || "Alerte FlyerMint",
        ...layout({
          title: payload.subject || "Alerte opérationnelle",
          body: `<p>${payload.summary ?? "Un événement nécessite une revue dans le studio."}</p>`,
          ctaLabel: "Ouvrir le studio",
          ctaUrl: `${app}/admin/monitoring`,
        }),
      };
    case "Welcome":
      return {
        subject: "Bienvenue sur FlyerMint",
        ...layout({
          title: "Bienvenue.",
          body: "<p>1 Mint offert sert à créer ta première affiche. 1 Mint = 1 génération. L’export ne consomme rien.</p>",
          ctaLabel: "Créer une affiche",
          ctaUrl: `${app}/create`,
        }),
      };
    default:
      return {
        subject: "FlyerMint",
        ...layout({ title: "FlyerMint", body: "<p>Notification.</p>" }),
      };
  }
}
