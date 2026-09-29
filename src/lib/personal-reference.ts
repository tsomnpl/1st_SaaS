import type { ReferenceSelection } from "@/lib/reference-select";
import { OFFICIAL_PLANS } from "@/lib/plans";

export const PERSONAL_REFERENCE_PLAN_CODES = OFFICIAL_PLANS.filter((plan) => plan.personalReference).map(
  (plan) => plan.code,
);

export function planAllowsPersonalReference(code: string) {
  return PERSONAL_REFERENCE_PLAN_CODES.includes(code);
}

export function assertPersonalReferenceAccess(hasAccess: boolean, personalReferenceUrl?: string) {
  if (!personalReferenceUrl) return;
  if (!hasAccess) throw new Error("PERSONAL_REFERENCE_LOCKED");
}

export function personalReferenceSelection(domain: string): ReferenceSelection {
  return {
    domain,
    slug: null,
    selected: {
      id: "personal-reference",
      domain,
      slug: "personal",
      storagePath: "personal/client-poster",
      style: "",
      background: "",
      texts: "",
      visual: "",
      palette: [],
      analyzed: true,
    },
    examined: [],
    rejectedOtherDomains: 0,
    reason: "The attached client poster is the primary visual source.",
  };
}
