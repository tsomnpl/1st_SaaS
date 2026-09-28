import { describe, expect, it } from "vitest";
import { sendImportantNotice, verifyMailTransport } from "@/server/mail";

const requested = process.env.MAIL_LIVE_TEST === "1";

describe.skipIf(!requested)("live Gmail SMTP", () => {
  it("verifies the mailbox and sends one test message", async () => {
    const user = process.env.GMAIL_USER?.trim() ?? "";
    const password = process.env.GMAIL_APP_PASSWORD ?? "";
    expect(user).not.toBe("");
    expect(password.trim()).not.toBe("");

    const verified = await verifyMailTransport();
    expect(verified.ok).toBe(true);

    const sent = await sendImportantNotice({
      to: user,
      subject: "FlyerMint, test SMTP",
      text: "Message de test du service e-mail FlyerMint.",
    });
    expect(sent.ok).toBe(true);
    if (sent.ok) {
      expect(sent.messageId.length).toBeGreaterThan(0);
      expect(JSON.stringify(sent).includes(password)).toBe(false);
    }
  }, 30_000);
});
