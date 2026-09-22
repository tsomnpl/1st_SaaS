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
  RODIUM_NO_IMAGE_EDIT_MODEL: "Aucun modèle image-to-image n’est disponible pour utiliser la référence visuelle.",
  RODIUM_INSUFFICIENT_BALANCE:
    "La génération d’image n’a pas pu partir : crédits Rodium insuffisants. Ton Mint n’a pas été débité.",
  RODIUM_IMAGES_FAILED_402:
    "La génération d’image n’a pas pu partir : crédits Rodium insuffisants. Ton Mint n’a pas été débité.",
  GENERATION_FAILED: "La génération a échoué. Ton Mint n’a pas été débité.",
  RODIUM_QUALITY_FAILED: "L’affiche n’était pas publiable. Ton Mint a été recrédité.",
  PAYMENT_VERIFY_FAILED: "Le statut du paiement n’a pas pu être vérifié.",
  INVALID_IMAGE: "L’image fournie n’est pas valide (JPG, PNG ou WEBP, 2 Mo max).",
  INVALID_PHONE: "Le numéro de téléphone n’est pas valide.",
  INVALID_EMAIL: "L’e-mail n’est pas valide.",
  RATE_LIMITED: "Trop de tentatives. Réessaie dans un instant.",
  EXPORT_LOCKED: "L’export éditable n’est pas inclus dans tes offres.",
  PERSONAL_REFERENCE_PREMIUM:
    "Cette fonctionnalité est disponible avec les packs 20 000 FCFA et 25 000 FCFA. Vous pouvez toutefois continuer avec la génération standard de FlyerMint.",
  PERSONAL_REFERENCE_REQUIRED:
    "Ajoutez une affiche de référence pour reproduire sa composition, ou choisissez un autre mode de création.",
  NOT_FOUND: "Ressource introuvable.",
};

export function publicErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN";
  if (MESSAGES[code]) return MESSAGES[code];
  if (Object.values(MESSAGES).includes(code)) return code;
  if (code.startsWith("RODIUM_")) return MESSAGES.RODIUM_UNAVAILABLE;
  return "Une erreur est survenue. Réessaie dans un instant.";
}

export function generationFailurePayload(error: unknown) {
  const raw = error instanceof Error ? error.message : "GENERATION_FAILED";
  const code = raw === "RODIUM_IMAGES_FAILED_402" ? "RODIUM_INSUFFICIENT_BALANCE" : raw;
  const status =
    code === "UNAUTHORIZED"
      ? 401
      : code === "INSUFFICIENT_MINTS" || code === "RODIUM_INSUFFICIENT_BALANCE"
        ? 402
        : code === "PERSONAL_REFERENCE_PREMIUM"
          ? 403
          : 400;
  return {
    status,
    body: {
      ok: false as const,
      error: code,
      message: publicErrorMessage(new Error(code)),
    },
  };
}
