import { describe, expect, it } from "vitest";
import {
  resolveMoneyFusionPaymentEndpoint,
  resolveMoneyFusionWebhookUrl,
} from "./moneyfusion";

describe("money fusion urls", () => {
  it("posts to a dashboard API link without appending /paiement", () => {
    expect(
      resolveMoneyFusionPaymentEndpoint(
        "https://pay.moneyfusion.net/FlyerMint/token/pay/",
      ),
    ).toBe("https://pay.moneyfusion.net/FlyerMint/token/pay");
  });

  it("keeps an explicit /paiement endpoint", () => {
    expect(
      resolveMoneyFusionPaymentEndpoint("https://pay.moneyfusion.net/paiement"),
    ).toBe("https://pay.moneyfusion.net/paiement");
  });

  it("appends /paiement when only a host was configured", () => {
    expect(resolveMoneyFusionPaymentEndpoint("https://pay.moneyfusion.net")).toBe(
      "https://pay.moneyfusion.net/paiement",
    );
  });

  it("uses the webhook route when the success page was saved as the webhook", () => {
    expect(
      resolveMoneyFusionWebhookUrl({
        appUrl: "https://flyermint.example",
        configured: "https://flyermint.example/payment/success",
      }),
    ).toBe("https://flyermint.example/api/webhooks/moneyfusion");
  });

  it("keeps a dedicated webhook url", () => {
    expect(
      resolveMoneyFusionWebhookUrl({
        appUrl: "https://flyermint.example",
        configured: "https://flyermint.example/api/webhooks/moneyfusion",
      }),
    ).toBe("https://flyermint.example/api/webhooks/moneyfusion");
  });
});
