export type PlanSeed = {
  code: string;
  name: string;
  shortName: string;
  headline: string;
  description: string;
  priceFcfa: number;
  mintAmount: number;
  durationDays: number | null;
  editableExport: boolean;
  sortOrder: number;
  highlighted?: boolean;
  features: string[];
};

export const OFFICIAL_PLANS: PlanSeed[] = [
  {
    code: "FREE",
    name: "Gratuit",
    shortName: "Découverte",
    headline: "1 Mint offert",
    description: "À l’inscription, tu reçois 1 Mint pour tester FlyerMint.",
    priceFcfa: 0,
    mintAmount: 1,
    durationDays: null,
    editableExport: false,
    sortOrder: 0,
    features: ["1 Mint offert à l’inscription", "1 Mint = 1 affiche", "Questionnaire intelligent"],
  },
  {
    code: "STARTER_2K",
    name: "Pack Starter",
    shortName: "Starter",
    headline: "Pour lancer une campagne",
    description: "Deux affiches, valables 30 jours.",
    priceFcfa: 2000,
    mintAmount: 2,
    durationDays: 30,
    editableExport: false,
    sortOrder: 1,
    features: [
      "2 Mints = 2 affiches",
      "Valables 30 jours",
      "1 Mint = 1 affiche",
      "Export image inclus",
    ],
  },
  {
    code: "PACK_5K",
    name: "Pack Essentiel",
    shortName: "Essentiel",
    headline: "Deux affiches, sans limite de temps",
    description: "Idéal si tu veux garder tes Mints.",
    priceFcfa: 5000,
    mintAmount: 2,
    durationDays: null,
    editableExport: false,
    sortOrder: 2,
    features: [
      "2 Mints = 2 affiches",
      "Sans expiration",
      "1 Mint = 1 affiche",
      "Export image inclus",
    ],
  },
  {
    code: "PACK_10K",
    name: "Pack Campagne",
    shortName: "Campagne",
    headline: "Cinq visuels pour une vraie série",
    description: "Assez de Mints pour un événement, un menu, une offre.",
    priceFcfa: 10000,
    mintAmount: 5,
    durationDays: null,
    editableExport: false,
    sortOrder: 3,
    features: [
      "5 Mints = 5 affiches",
      "Sans expiration",
      "1 Mint = 1 affiche",
      "Export image inclus",
    ],
  },
  {
    code: "PACK_15K",
    name: "Pack Studio",
    shortName: "Studio",
    headline: "Le rythme d’un vrai studio",
    description: "Dix affiches, sans expiration — le meilleur équilibre.",
    priceFcfa: 15000,
    mintAmount: 10,
    durationDays: null,
    editableExport: false,
    sortOrder: 4,
    highlighted: true,
    features: [
      "10 Mints = 10 affiches",
      "Sans expiration",
      "1 Mint = 1 affiche",
      "Export image inclus",
      "Idéal multi-campagnes",
    ],
  },
  {
    code: "PACK_20K",
    name: "Pack Pro",
    shortName: "Pro",
    headline: "Volume + pack éditable",
    description: "Quinze affiches et un export des textes pour retoucher hors IA.",
    priceFcfa: 20000,
    mintAmount: 15,
    durationDays: null,
    editableExport: true,
    sortOrder: 5,
    features: [
      "15 Mints = 15 affiches",
      "Sans expiration",
      "1 Mint = 1 affiche",
      "Export image inclus",
      "Pack éditable (image + textes + HTML)",
    ],
  },
  {
    code: "PACK_25K",
    name: "Pack Atelier",
    shortName: "Atelier",
    headline: "Le plus de Mints",
    description: "Vingt affiches, sans expiration, avec pack éditable.",
    priceFcfa: 25000,
    mintAmount: 20,
    durationDays: null,
    editableExport: true,
    sortOrder: 6,
    features: [
      "20 Mints = 20 affiches",
      "Sans expiration",
      "1 Mint = 1 affiche",
      "Export image inclus",
      "Pack éditable (image + textes + HTML)",
    ],
  },
];

export function formatFcfa(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export function paidPlans() {
  return OFFICIAL_PLANS.filter((plan) => plan.priceFcfa > 0);
}
