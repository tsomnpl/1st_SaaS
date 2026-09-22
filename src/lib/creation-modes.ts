export const CREATION_MODE_IDS = [
  "idea",
  "product",
  "offer",
  "event",
  "photo",
  "brand",
  "reference_reproduction",
] as const;

export type CreationModeId = (typeof CREATION_MODE_IDS)[number];

export type CreationMode = {
  id: CreationModeId;
  number: number;
  title: string;
  description: string;
  hint: string;
  examples: string[];
  premium: boolean;
  defaultVisualType: string;
};

export const CREATION_MODES: CreationMode[] = [
  {
    id: "idea",
    number: 1,
    title: "Partir d’une idée",
    description: "Décrivez simplement ce que vous voulez. FlyerMint construit la direction artistique.",
    hint: "Idéal si vous n’avez pas encore de visuel : FlyerMint compose le concept, la mise en scène et le CTA.",
    examples: [
      "Affiche pour vendre mes formations Excel",
      "Affiche pour un restaurant",
      "Annoncer une soirée",
    ],
    premium: false,
    defaultVisualType: "Affiche promotionnelle",
  },
  {
    id: "product",
    number: 2,
    title: "Mettre en avant un produit",
    description: "Nom, prix, avantage, logo et photo du produit. La pub se construit autour de lui.",
    hint: "Si vous fournissez une photo du produit, elle doit apparaître dans l’affiche finale.",
    examples: ["Google AI Plus", "Menu du chef", "Nouvelle collection"],
    premium: false,
    defaultVisualType: "Catalogue produit",
  },
  {
    id: "offer",
    number: 3,
    title: "Créer une offre",
    description: "Promotion : ancien prix, nouveau prix, durée, avantages et CTA, sans surcharger l’affiche.",
    hint: "Le prix est visible, mais il ne doit pas écraser le produit ni la hiérarchie.",
    examples: ["-50 % ce week-end", "2 pour 1", "Lancement à 5 000 FCFA"],
    premium: false,
    defaultVisualType: "Affiche promotionnelle",
  },
  {
    id: "event",
    number: 4,
    title: "Promouvoir un événement",
    description: "Soirée, formation, mariage, concert, conférence : nom, date, heure, lieu, contact.",
    hint: "FlyerMint choisit une composition adaptée au domaine. Inutile de tout décrire.",
    examples: ["Concert samedi", "Masterclass", "Anniversaire"],
    premium: false,
    defaultVisualType: "Affiche événement",
  },
  {
    id: "photo",
    number: 5,
    title: "Transformer une photo",
    description: "Vous fournissez l’image principale. FlyerMint l’intègre dans une composition publicitaire.",
    hint: "La photo reste fidèle au sujet : personne, produit, vêtement, nourriture, bâtiment…",
    examples: ["Photo du plat", "Portrait du formateur", "Capture d’écran"],
    premium: false,
    defaultVisualType: "Story / post réseaux",
  },
  {
    id: "brand",
    number: 6,
    title: "Utiliser mon identité de marque",
    description: "Logo, couleurs, slogan et nom de marque. Le logo fourni est intégré, jamais redessiné.",
    hint: "Les couleurs fournies deviennent l’identité. Le logo reste lisible, proportionné, avec de l’air autour.",
    examples: ["Kit NPLShop", "Couleurs + slogan", "Logo PNG + photo produit"],
    premium: false,
    defaultVisualType: "Affiche promotionnelle",
  },
  {
    id: "reference_reproduction",
    number: 7,
    title: "Reproduire une composition",
    description:
      "Fournissez une affiche dont vous aimez la structure. FlyerMint transpose sa grammaire visuelle à votre contenu.",
    hint: "On conserve cadrage, perspective, bordures et hiérarchie. On remplace marque, produit, prix et contact.",
    examples: ["Même cadrage, nouveau produit", "Garder les bordures, changer la marque"],
    premium: true,
    defaultVisualType: "Affiche promotionnelle",
  },
];

export const PREMIUM_CREATION_MODE: CreationModeId = "reference_reproduction";

export function isCreationModeId(value: string): value is CreationModeId {
  return (CREATION_MODE_IDS as readonly string[]).includes(value);
}

export function creationModeById(id: string | undefined): CreationMode | undefined {
  if (!id || !isCreationModeId(id)) return undefined;
  return CREATION_MODES.find((mode) => mode.id === id);
}

export function modeRequiresPersonalReference(mode: CreationModeId | undefined) {
  return mode === PREMIUM_CREATION_MODE;
}

export function modeIsPremium(mode: CreationModeId | undefined) {
  return mode === PREMIUM_CREATION_MODE;
}
