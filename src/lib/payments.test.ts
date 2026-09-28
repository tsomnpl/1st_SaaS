import { describe, expect, it } from "vitest";
import { buildMoneyFusionPayload, classifyPaymentStatus, moneyFusionInitUrl } from "@/server/payments";
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
    expect(classifyPaymentStatus("no paid")).toBe("PENDING");
    expect(classifyPaymentStatus("payin.session.completed")).toBe("COMPLETED");
    expect(classifyPaymentStatus("payin.session.cancelled")).toBe("CANCELLED");
    expect(classifyPaymentStatus("failure")).toBe("FAILED");
  });

  it("posts to the merchant pay url and sends an article list", () => {
    const endpoint = moneyFusionInitUrl("https://pay.moneyfusion.net/Boutique/abc123/pay/");
    expect(endpoint).toBe("https://pay.moneyfusion.net/Boutique/abc123/pay");
    expect(endpoint.endsWith("/paiement")).toBe(false);

    const payload = buildMoneyFusionPayload({
      totalPrice: 2000,
      articleName: "Pack Starter",
      orderId: "FM-1",
      userId: "user_1",
      nomclient: "Awa",
      returnUrl: "https://app.test/payment/success",
      webhookUrl: "https://app.test/api/webhooks/moneyfusion",
    });
    expect(payload.article).toEqual([{ "Pack Starter": 2000 }]);
    expect(payload.personal_Info).toEqual([{ orderId: "FM-1", userId: "user_1" }]);
    expect(payload.nomclient).toBe("Awa");
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
