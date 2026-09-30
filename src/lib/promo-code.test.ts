import { describe, expect, it } from "vitest";
import { isPromoCodeShape, normalizePromoCode, promoBlockReason } from "@/lib/promo-code";

describe("promo codes", () => {
  it("normalizes spacing and case", () => {
    expect(normalizePromoCode("  lance 30 ")).toBe("LANCE30");
    expect(isPromoCodeShape("LANCE30")).toBe(true);
    expect(isPromoCodeShape("A")).toBe(false);
    expect(isPromoCodeShape("-LANCE")).toBe(false);
  });

  it("blocks a code that is off, already used, or full", () => {
    expect(promoBlockReason({ active: false, usedCount: 0, maxUses: 30, alreadyRedeemed: false })).toBe("PROMO_INACTIVE");
    expect(promoBlockReason({ active: true, usedCount: 1, maxUses: 30, alreadyRedeemed: true })).toBe("PROMO_ALREADY_USED");
    expect(promoBlockReason({ active: true, usedCount: 30, maxUses: 30, alreadyRedeemed: false })).toBe("PROMO_EXHAUSTED");
    expect(promoBlockReason({ active: true, usedCount: 29, maxUses: 30, alreadyRedeemed: false })).toBeNull();
  });
});
