import type { Locale } from "@/lib/i18n";
import { planAvailabilityLabel, type PlanSeed } from "@/lib/plans";

const en: Record<string, Pick<PlanSeed, "name" | "shortName" | "headline" | "description" | "features"> & { availability: string }> = {
  FREE: {
    name: "Free",
    shortName: "Discover",
    headline: "1 Mint included",
    description: "When you sign up, you get 1 Mint to try FlyerMint.",
    features: ["1 Mint free when you sign up", "1 Mint = 1 poster", "Smart questionnaire"],
    availability: "No expiry",
  },
  STARTER_2K: {
    name: "Starter pack",
    shortName: "Starter",
    headline: "To launch a campaign",
    description: "Two posters. Launch offer, removed 30 days after the real launch.",
    features: [
      "2 Mints = 2 posters",
      "Removed 30 days after launch",
      "Mints do not expire",
      "1 Mint = 1 poster",
      "Image export included",
    ],
    availability: "Removed 30 days after launch. Mints do not expire",
  },
  PACK_5K: {
    name: "Essential pack",
    shortName: "Essential",
    headline: "Two posters, no time limit",
    description: "Right if you want to keep your Mints.",
    features: ["2 Mints = 2 posters", "No expiry", "1 Mint = 1 poster", "Image export included"],
    availability: "No expiry",
  },
  PACK_10K: {
    name: "Campaign pack",
    shortName: "Campaign",
    headline: "Five visuals for a real series",
    description: "Enough Mints for an event, a menu, an offer.",
    features: ["5 Mints = 5 posters", "No expiry", "1 Mint = 1 poster", "Image export included"],
    availability: "No expiry",
  },
  PACK_15K: {
    name: "Studio pack",
    shortName: "Studio",
    headline: "The pace of a real studio",
    description: "Ten posters, no expiry, the best balance.",
    features: ["10 Mints = 10 posters", "No expiry", "1 Mint = 1 poster", "Image export included", "Made for several campaigns"],
    availability: "No expiry",
  },
  PACK_20K: {
    name: "Pro pack",
    shortName: "Pro",
    headline: "Volume plus an editable pack",
    description: "Fifteen posters, a text export, and a copy of your own poster.",
    features: [
      "15 Mints = 15 posters",
      "No expiry",
      "1 Mint = 1 poster",
      "Image export included",
      "Editable pack (image + text + HTML)",
      "Personal reference: reproduce your own poster",
    ],
    availability: "No expiry",
  },
  PACK_25K: {
    name: "Atelier pack",
    shortName: "Atelier",
    headline: "The most Mints",
    description: "Twenty posters, no expiry, with an editable pack and a personal reference.",
    features: [
      "20 Mints = 20 posters",
      "No expiry",
      "1 Mint = 1 poster",
      "Image export included",
      "Editable pack (image + text + HTML)",
      "Personal reference: reproduce your own poster",
    ],
    availability: "No expiry",
  },
};

export function localizePlan<T extends PlanSeed>(plan: T, locale: Locale): T {
  if (locale !== "en") return plan;
  const overlay = en[plan.code];
  if (!overlay) return plan;
  return { ...plan, ...overlay };
}

export function localizedAvailability(plan: { code: string; durationDays: number | null }, locale: Locale) {
  if (locale === "en") {
    return en[plan.code]?.availability ?? (plan.durationDays ? `Valid for ${plan.durationDays} days` : "No expiry");
  }
  return planAvailabilityLabel(plan);
}
