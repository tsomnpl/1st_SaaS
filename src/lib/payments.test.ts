import { describe, expect, it } from "vitest";
import {
  buildMoneyFusionInitPayload,
  classifyPaymentStatus,
  extractPaymentToken,
  moneyFusionPayEndpoint,
  moneyFusionRawStatus,
} from "@/server/payments";
import { sanitizeRecord } from "@/lib/sanitize";

describe("Money Fusion status and sanitization", () => {
  it("classifies paid, cancelled, failed and pending", () => {
    expect(classifyPaymentStatus("paid")).toBe("COMPLETED");
    expect(classifyPaymentStatus("COMPLETED")).toBe("COMPLETED");
    expect(classifyPaymentStatus("payé")).toBe("COMPLETED");
    expect(classifyPaymentStatus("cancelled")).toBe("CANCELLED");
    expect(classifyPaymentStatus("annulé")).toBe("CANCELLED");
    expect(classifyPaymentStatus("failed")).toBe("FAILED");
    expect(classifyPaymentStatus("pending")).toBe("PENDING");
    expect(classifyPaymentStatus("unknown-xyz")).toBe("PENDING");
  });

  it("does not treat 'no paid' as a successful payment", () => {
    expect(classifyPaymentStatus("no paid")).toBe("PENDING");
    expect(classifyPaymentStatus("No Paid")).toBe("PENDING");
    expect(classifyPaymentStatus("nopaid")).toBe("PENDING");
    expect(classifyPaymentStatus("non payé")).toBe("PENDING");
  });

  it("maps payin.session.completed webhooks to paid", () => {
    expect(moneyFusionRawStatus({ event: "payin.session.completed" })).toBe("paid");
    expect(classifyPaymentStatus(moneyFusionRawStatus({ event: "payin.session.completed" }))).toBe("COMPLETED");
    expect(moneyFusionRawStatus({ event: "payin.session.cancelled" })).toBe("cancelled");
    expect(moneyFusionRawStatus({ data: { statut: "no paid" } })).toBe("no paid");
    expect(classifyPaymentStatus(moneyFusionRawStatus({ data: { statut: "no paid" } }))).toBe("PENDING");
  });

  it("posts article as an array and the dashboard URL as-is", () => {
    const payload = buildMoneyFusionInitPayload({
      planName: "Pack 10",
      amountFcfa: 5000,
      numeroSend: "0700000000",
      nomclient: "Ada",
      userId: "user_1",
      orderId: "FM-1",
      returnUrl: "https://flyermint.app/payment/success",
      webhookUrl: "https://flyermint.app/api/webhooks/moneyfusion",
    });
    expect(Array.isArray(payload.article)).toBe(true);
    expect(payload.article[0]).toEqual({ "Pack 10": 5000 });
    expect(Array.isArray(payload.personal_Info)).toBe(true);
    expect(payload.personal_Info[0]).toEqual({ userId: "user_1", orderId: "FM-1" });
    expect(moneyFusionPayEndpoint("https://www.pay.moneyfusion.net/FlyerMint/id/pay/")).toBe(
      "https://www.pay.moneyfusion.net/FlyerMint/id/pay",
    );
    expect(moneyFusionPayEndpoint("https://www.pay.moneyfusion.net/FlyerMint/id/pay")).not.toMatch(/\/paiement$/);
  });

  it("reads nested Money Fusion tokens", () => {
    expect(extractPaymentToken({ data: { token: "abc" } })).toBe("abc");
    expect(extractPaymentToken({ tokenPay: "xyz" })).toBe("xyz");
    expect(extractPaymentToken({})).toBe("");
  });

  it("redacts secrets from webhook payloads", () => {
    const clean = sanitizeRecord({
      token: "pay_123",
      status: "paid",
      CLERK_SECRET_KEY: "sk_live_should_not_stay",
      rodiuMai_api_key: "abc",
    }) as Record<string, unknown>;
    expect(clean.token).toBe("pay_123");
    expect(clean.status).toBe("paid");
    expect(clean.CLERK_SECRET_KEY).toBe("[redacted]");
    expect(clean.rodiuMai_api_key).toBe("[redacted]");
  });
});
