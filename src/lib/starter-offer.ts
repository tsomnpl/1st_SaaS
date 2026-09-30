export const STARTER_OFFER_CODE = "STARTER_2K";
export const STARTER_OFFER_DAY_MIN = 1;
export const STARTER_OFFER_DAY_MAX = 365;

export function starterOfferDeadline(days: number, now = new Date()) {
  if (!Number.isInteger(days) || days < STARTER_OFFER_DAY_MIN || days > STARTER_OFFER_DAY_MAX) {
    throw new Error("PLAN_INVALID");
  }
  return new Date(now.getTime() + days * 86400000);
}

export function isStarterOfferLive(
  input: { active: boolean; offerEndsAt: Date | string | null | undefined },
  now = new Date(),
) {
  if (!input.active || !input.offerEndsAt) return false;
  const ends = new Date(input.offerEndsAt);
  return !Number.isNaN(ends.getTime()) && ends.getTime() > now.getTime();
}
