import { describe, expect, it } from "vitest";
import { paymentCanBeDiscarded } from "@/lib/payment-discard";

describe("payment discard", () => {
  it("allows an uncredited pending or failed payment", () => {
    expect(paymentCanBeDiscarded({ status: "PENDING", creditedAt: null, creditedByPurchase: false })).toBe(true);
    expect(paymentCanBeDiscarded({ status: "FAILED", creditedAt: null, creditedByPurchase: false })).toBe(true);
  });

  it("keeps credited, completed and cancelled payments", () => {
    expect(paymentCanBeDiscarded({ status: "PENDING", creditedAt: new Date(), creditedByPurchase: false })).toBe(false);
    expect(paymentCanBeDiscarded({ status: "PENDING", creditedAt: null, creditedByPurchase: true })).toBe(false);
    expect(paymentCanBeDiscarded({ status: "COMPLETED", creditedAt: null, creditedByPurchase: false })).toBe(false);
    expect(paymentCanBeDiscarded({ status: "CANCELLED", creditedAt: null, creditedByPurchase: false })).toBe(false);
  });
});
