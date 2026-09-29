import { describe, expect, it } from "vitest";
import {
  detectImageMime,
  formatTicketNumber,
  generationContext,
  paymentContext,
  safeFileName,
  supportEmailKey,
  supportNoticeRecipients,
  visibleToUser,
} from "@/lib/support";

describe("support helpers", () => {
  it("formats a stable public ticket number", () => {
    expect(formatTicketNumber(1)).toBe("FM-000001");
    expect(formatTicketNumber(124)).toBe("FM-000124");
  });

  it("builds one email key per event", () => {
    expect(supportEmailKey("SUPPORT_REPLY", "ticket", "message")).toBe("SUPPORT_REPLY:ticket:message");
    expect(supportEmailKey("SUPPORT_REPLY", "ticket", "message")).toBe(supportEmailKey("SUPPORT_REPLY", "ticket", "message"));
  });

  it("notifies the admin inbox and the gmail sender once each", () => {
    expect(supportNoticeRecipients({
      ADMIN_EMAIL: "Owner@Example.com",
      SUPPORT_EMAIL: "",
      GMAIL_USER: "sender@example.com",
    })).toEqual(["Owner@Example.com", "sender@example.com"]);
    expect(supportNoticeRecipients({
      ADMIN_EMAIL: "owner@example.com",
      GMAIL_USER: "Owner@Example.com",
    })).toEqual(["owner@example.com"]);
    expect(supportNoticeRecipients({})).toEqual([]);
  });

  it("hides internal notes from the user view", () => {
    const visible = visibleToUser([
      { isInternal: false, content: "public" },
      { isInternal: true, content: "secret note" },
    ]);
    expect(visible).toEqual([{ isInternal: false, content: "public" }]);
  });

  it("accepts png jpeg and webp bytes only", () => {
    expect(detectImageMime(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg");
    expect(detectImageMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe("image/png");
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(detectImageMime(webp)).toBe("image/webp");
    expect(detectImageMime(Uint8Array.from([0x25, 0x50, 0x44, 0x46]))).toBeNull();
  });

  it("drops paths and odd characters from file names", () => {
    expect(safeFileName("../secret/ma capture.png")).toBe("ma-capture.png");
  });

  it("keeps generation facts and drops embedded images", () => {
    const context = generationContext({
      id: "gen-1",
      createdAt: new Date("2026-09-29T00:00:00.000Z"),
      model: "google/gemini-3-pro-image",
      status: "FAILED",
      mintCost: 1,
      rodiCost: 1.2,
      outputUrl: "data:image/png;base64,aaaa",
      brief: { title: "Soirée", personalReferenceUrl: "data:image/png;base64,bbbb", location: "Rue privée" },
      artDirection: { palette: "violet", image: "data:image/png;base64,cccc" },
      qualityDetails: { error: "QC_FAIL" },
    });
    expect(context.outputUrl).toBeNull();
    expect(context.hasOutput).toBe(true);
    expect(context.brief).toEqual({ title: "Soirée", location: "Rue privée" });
    expect(context.artDirection).toEqual({ palette: "violet" });
    expect(context.error).toBe("QC_FAIL");
    expect(JSON.stringify(context).includes("base64")).toBe(false);
  });

  it("does not copy a payment token into the support context", () => {
    const context = paymentContext({
      id: "pay-1",
      orderId: "FM-PAY-1",
      amountFcfa: 5000,
      status: "PENDING",
      createdAt: new Date("2026-09-29T00:00:00.000Z"),
      plan: { code: "PACK_5K", name: "Pack 5 000", mintAmount: 2 },
    });
    expect(context.orderId).toBe("FM-PAY-1");
    expect("tokenPay" in context).toBe(false);
  });
});
