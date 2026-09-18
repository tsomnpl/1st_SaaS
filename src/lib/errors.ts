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
  RODIUMAI_API_KEY_MISSING: "La génération n’est pas disponible pour le moment.",
  RODIUM_UNAVAILABLE: "La génération n’est pas disponible pour le moment.",
  RODIUM_NO_IMAGE_MODEL: "Aucun modèle image n’est disponible actuellement.",
  GENERATION_FAILED: "La génération a échoué. Ton Mint n’a pas été débité.",
  INVALID_IMAGE: "L’image fournie n’est pas valide (JPG, PNG ou WEBP, 2 Mo max).",
  RATE_LIMITED: "Trop de tentatives. Réessaie dans un instant.",
};

export function publicErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN";
  if (MESSAGES[code]) return MESSAGES[code];
  if (code.startsWith("RODIUM_")) return MESSAGES.RODIUM_UNAVAILABLE;
  return "Une erreur est survenue. Réessaie dans un instant.";
}
