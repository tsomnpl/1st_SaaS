const MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Connecte-toi pour continuer.",
  FORBIDDEN: "Accès refusé.",
  ACCOUNT_SUSPENDED: "Ce compte est suspendu.",
  USER_NOT_FOUND: "Compte introuvable.",
  INSUFFICIENT_MINTS: "Il te faut 1 Mint pour générer une affiche.",
  PLAN_INVALID: "Cette offre n’est plus disponible.",
  PAYMENT_INIT_FAILED: "Le paiement n’a pas pu démarrer. Réessaie.",
  PAYMENT_NOT_FOUND: "Paiement introuvable.",
  MONEY_FUSION_API_URL_MISSING: "Le paiement n’est pas encore configuré.",
  NEXT_PUBLIC_APP_URL_MISSING: "L’adresse du site n’est pas configurée.",
  RODIUMAI_API_KEY_MISSING: "La clé de génération d’images n’est pas configurée sur ce déploiement.",
  RODIUM_UNAVAILABLE: "La génération n’est pas disponible pour le moment.",
  RODIUM_NO_IMAGE_MODEL: "Aucun modèle image n’est disponible actuellement.",
  RODIUM_INSUFFICIENT_BALANCE:
    "Crédits image insuffisants (solde libre). Le total peut être bloqué en réserve — libère ou recharge la clé fournie dans les secrets du déploiement.",
  GENERATION_TIMEOUT: "La génération a pris trop de temps. Réessaie — ton Mint n’a pas dû être consommé si l’échec est confirmé.",
  GENERATION_FAILED: "La génération a échoué. Ton Mint n’a pas été débité.",
  INVALID_IMAGE: "L’image fournie n’est pas valide (JPG, PNG ou WEBP, 2 Mo max).",
  INVALID_TICKET: "La demande est incomplète.",
  ATTACHMENT_REJECTED: "La pièce jointe n’est pas acceptée (JPG, PNG, WEBP ou PDF, 2 Mo max).",
  FEEDBACK_EXISTS: "Un avis a déjà été enregistré pour cette affiche.",
  TICKET_ID_FAILED: "La demande n’a pas pu être numérotée. Réessaie.",
  INVALID_PHONE: "Le numéro de téléphone n’est pas valide.",
  INVALID_EMAIL: "L’e-mail n’est pas valide.",
  RATE_LIMITED: "Trop de tentatives. Réessaie dans un instant.",
  CSAT_ALREADY_ANSWERED: "Tu as déjà noté cette demande. Merci !",
  CSAT_NOT_AVAILABLE: "La note est disponible une fois la demande résolue.",
  EXPORT_LOCKED: "L’export éditable n’est pas inclus dans tes offres.",
  NOT_FOUND: "Ressource introuvable.",
};

export function publicErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN";
  if (MESSAGES[code]) return MESSAGES[code];
  if (code.startsWith("RODIUM_")) return MESSAGES.RODIUM_UNAVAILABLE;
  return "Une erreur est survenue. Réessaie dans un instant.";
}
