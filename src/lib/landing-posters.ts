/** Stable landing IDs. Do not pick "first Restauration" or a changing diverse slice — that swaps posters on every deploy. */

export const AFTER_POSTER_ID = "restauration-burger";
export const AFTER_POSTER_FALLBACK_ID = "restauration-03";

/** Always first in /creations so the chat posters are not buried under extras. */
export const CREATIONS_PINNED_IDS = ["restauration-burger", "restauration-03", "mode-03"] as const;

export const LANDING_SHOWCASE_IDS = [
  "evenementiel-01",
  "restauration-03",
  "mode-03",
  "restauration-burger",
  "beaute-03",
  "immobilier-business-01",
  "sport-finance-01",
  "techno-education-03",
] as const;

export const HERO_POSTER_IDS = [
  "evenementiel-01",
  "evenementiel-02",
  "restauration-03",
  "mode-03",
  "beaute-03",
  "immobilier-business-01",
  "immobilier-business-03",
  "techno-education-03",
  "sport-finance-01",
  "sante-tourisme-associations-02",
] as const;

export const PINNED_BURGER_POSTER = {
  id: AFTER_POSTER_ID,
  title: "MENU DU SOIR",
  subtitle: "Burger + boisson",
  meta: "5 000 FCFA",
  cta: "Commander",
  imageSrc: "/creations/restauration-burger.webp",
  domaine: "Restauration",
  domainKey: "Restauration" as const,
};
