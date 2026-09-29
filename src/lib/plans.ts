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
  personalReference: boolean;
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
    personalReference: false,
    sortOrder: 0,
    features: ["1 Mint offert à l’inscription", "1 Mint = 1 affiche", "Questionnaire intelligent"],
  },
  {
    code: "STARTER_2K",
    name: "Pack Starter",
    shortName: "Starter",
    headline: "Pour lancer une campagne",
    description: "Deux affiches. Offre de lancement, retirée 30 jours après le lancement réel.",
    priceFcfa: 2000,
    mintAmount: 2,
    durationDays: null,
    editableExport: false,
    personalReference: false,
    sortOrder: 1,
    features: [
      "2 Mints = 2 affiches",
      "Offre retirée 30 jours après le lancement",
      "Les Mints n’expirent pas",
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
    personalReference: false,
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
    personalReference: false,
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
    description: "Dix affiches, sans expiration, le meilleur équilibre.",
    priceFcfa: 15000,
    mintAmount: 10,
    durationDays: null,
    editableExport: false,
    personalReference: false,
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
    description: "Quinze affiches, un export des textes, et la reproduction de ta propre affiche.",
    priceFcfa: 20000,
    mintAmount: 15,
    durationDays: null,
    editableExport: true,
    personalReference: true,
    sortOrder: 5,
    features: [
      "15 Mints = 15 affiches",
      "Sans expiration",
      "1 Mint = 1 affiche",
      "Export image inclus",
      "Pack éditable (image + textes + HTML)",
      "Référence personnelle : reproduire ta propre affiche",
    ],
  },
  {
    code: "PACK_25K",
    name: "Pack Atelier",
    shortName: "Atelier",
    headline: "Le plus de Mints",
    description: "Vingt affiches, sans expiration, avec pack éditable et référence personnelle.",
    priceFcfa: 25000,
    mintAmount: 20,
    durationDays: null,
    editableExport: true,
    personalReference: true,
    sortOrder: 6,
    features: [
      "20 Mints = 20 affiches",
      "Sans expiration",
      "1 Mint = 1 affiche",
      "Export image inclus",
      "Pack éditable (image + textes + HTML)",
      "Référence personnelle : reproduire ta propre affiche",
    ],
  },
];

export function formatFcfa(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export const LAUNCH_OFFER_CODE = "STARTER_2K";
export const LAUNCH_OFFER_DAYS = 30;

export function paidPlans() {
  return OFFICIAL_PLANS.filter((plan) => plan.priceFcfa > 0);
}

export function readLaunchAt(raw = process.env.APP_LAUNCH_AT) {
  const text = raw?.trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function launchOfferEndsAt(launchAt: Date | null) {
  if (!launchAt) return null;
  return new Date(launchAt.getTime() + LAUNCH_OFFER_DAYS * 86400000);
}

export function isLaunchOfferOpen(now = new Date(), launchAt = readLaunchAt()) {
  const ends = launchOfferEndsAt(launchAt);
  if (!ends) return true;
  return now.getTime() < ends.getTime();
}

export function visiblePaidPlans(now = new Date(), launchAt = readLaunchAt()) {
  return paidPlans().filter((plan) => plan.code !== LAUNCH_OFFER_CODE || isLaunchOfferOpen(now, launchAt));
}

export function planAvailabilityLabel(plan: { code: string; durationDays: number | null }) {
  if (plan.code === LAUNCH_OFFER_CODE) {
    return "Offre retirée 30 jours après le lancement. Mints sans expiration";
  }
  return plan.durationDays ? `Valables ${plan.durationDays} jours` : "Sans expiration";
}
