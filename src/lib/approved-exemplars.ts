export type ApprovedExemplar = {
  id: string;
  domain: "Evenementiel" | "Restauration" | "Mode & Accessoires";
  title: string;
  subtitle: string;
  meta: string;
  cta: string;
  tone: "night" | "warm" | "gold";
  publicSrc: string;
  width: number;
  height: number;
  bytesWebp: number;
  visualNotes: string;
};

/** Affiches validées à réutiliser comme direction visuelle, jamais comme copie publique de references.pdf. */
export const APPROVED_EXEMPLARS: ApprovedExemplar[] = [
  {
    id: "evenementiel-night-wave",
    domain: "Evenementiel",
    title: "NIGHT WAVE",
    subtitle: "Concert live",
    meta: "Sam. 21h · Plateau",
    cta: "Prends ta place",
    tone: "night",
    publicSrc: "/creations/exemplars/evenementiel-night-wave.webp",
    width: 896,
    height: 1200,
    bytesWebp: 124950,
    visualNotes:
      "Scène concert sombre, deux musiciens réels (chant + guitare), anneaux lumière orange, titre or 3D centré, bandeau date orange, bloc infos et billets en bas, contact sur une ligne. Hiérarchie titre > scène > infos.",
  },
  {
    id: "restauration-menu-du-soir",
    domain: "Restauration",
    title: "MENU DU SOIR",
    subtitle: "Burger + boisson",
    meta: "5 000 FCFA",
    cta: "Commander",
    tone: "warm",
    publicSrc: "/creations/exemplars/restauration-menu-du-soir.webp",
    width: 896,
    height: 1200,
    bytesWebp: 106150,
    visualNotes:
      "Fond rouge saturé, chef en plan réel sur le plat, prix en pastille blanche, pastille offre, CTA COMMANDER très grand, bandeau téléphone blanc en bas. Un seul produit héros.",
  },
  {
    id: "mode-nouvelle-collection",
    domain: "Mode & Accessoires",
    title: "NOUVELLE COLLECTION",
    subtitle: "Lookbook été",
    meta: "Édition limitée",
    cta: "Découvrir",
    tone: "gold",
    publicSrc: "/creations/exemplars/mode-nouvelle-collection.webp",
    width: 896,
    height: 1200,
    bytesWebp: 202448,
    visualNotes:
      "Lookbook éditorial, mannequin de dos/trois-quarts, grille de produits (bijoux, chemise, sandales, foulard), bandeau offre exclusive, édition limitée. Beaucoup d'air autour du titre, palette terre et or.",
  },
];

export function exemplarForDomain(domain: string) {
  return APPROVED_EXEMPLARS.find((item) => item.domain === domain);
}
