export function normalizePromoCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isPromoCodeShape(code: string) {
  return /^[A-Z0-9][A-Z0-9_-]{1,22}[A-Z0-9]$/.test(code);
}

export function promoBlockReason(input: {
  active: boolean;
  usedCount: number;
  maxUses: number;
  alreadyRedeemed: boolean;
}) {
  if (!input.active) return "PROMO_INACTIVE";
  if (input.alreadyRedeemed) return "PROMO_ALREADY_USED";
  if (input.usedCount >= input.maxUses) return "PROMO_EXHAUSTED";
  return null;
}
