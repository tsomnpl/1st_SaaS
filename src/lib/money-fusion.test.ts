import { describe, expect, it } from "vitest";
import { extractMoneyFusionToken, MONEY_FUSION_SAMPLE_PAID_PAYLOAD } from "./money-fusion";
import { classifyPaymentStatus } from "@/server/payments";

describe("Money Fusion webhook token extraction", () => {
  it("rejects empty payloads with TOKEN_MISSING semantics", () => {
    expect(extractMoneyFusionToken({})).toBe("");
  });

  it("reads a realistic paid payload, not just {}", () => {
    expect(extractMoneyFusionToken({ ...MONEY_FUSION_SAMPLE_PAID_PAYLOAD })).toBe("MF-TEST-9f3c2a1b");
    expect(classifyPaymentStatus(String(MONEY_FUSION_SAMPLE_PAID_PAYLOAD.data.status))).toBe("COMPLETED");
  });

  it("accepts nested data.token from Money Fusion callbacks", () => {
    expect(
      extractMoneyFusionToken({
        statut: true,
        data: { token: "tok_nested", status: "payé" },
      }),
    ).toBe("tok_nested");
  });
});
