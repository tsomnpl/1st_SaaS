import { describe, expect, it } from "vitest";
import { PRODUCTION_APP_URL, moneyFusionPublicUrls } from "./env";

describe("Money Fusion public URLs", () => {
  it("uses one stable return URL and one webhook on the live domain", () => {
    const urls = moneyFusionPublicUrls(PRODUCTION_APP_URL);
    expect(urls.returnUrl).toBe("https://flyermint-t.vercel.app/payment/success");
    expect(urls.webhookUrl).toBe("https://flyermint-t.vercel.app/api/webhooks/moneyfusion");
    expect(urls.returnUrl).not.toMatch(/2000|5000|10000|plan=/);
  });
});
