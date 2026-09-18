import { describe, expect, it } from "vitest";
import { classifyPaymentStatus } from "@/server/payments";
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
