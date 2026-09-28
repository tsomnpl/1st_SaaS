import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.hoisted(() => vi.fn());
const verify = vi.hoisted(() => vi.fn());
const createTransport = vi.hoisted(() => vi.fn(() => ({ sendMail, verify })));

vi.mock("nodemailer", () => ({
  createTransport,
}));

import { escapeHtml, paymentConfirmedMessage } from "@/server/mail-messages";
import {
  gmailSmtpSettings,
  redactMailError,
  sendGenerationFailed,
  sendImportantNotice,
  sendPaymentConfirmed,
  sendTicketCreated,
  verifyMailTransport,
} from "@/server/mail";

describe("gmail mailer", () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env = { ...env };
    sendMail.mockReset();
    verify.mockReset();
    createTransport.mockClear();
    sendMail.mockResolvedValue({ messageId: "<id@gmail>" });
    verify.mockResolvedValue(true);
  });

  it("uses Gmail SMTP on port 587 with TLS required", () => {
    expect(gmailSmtpSettings("sender@example.com", "secret")).toMatchObject({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: "sender@example.com", pass: "secret" },
      logger: false,
      debug: false,
    });
  });

  it("refuses to send when the server variables are missing", async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    const result = await sendPaymentConfirmed({
      to: "buyer@example.com",
      orderId: "FM-1",
      planName: "Pack Starter",
      amountFcfa: 2000,
      mintAmount: 2,
      appUrl: "http://app.test",
    });
    expect(result).toEqual({ ok: false, error: "MAIL_NOT_CONFIGURED" });
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("sends a payment email and strips spaces from the app password", async () => {
    process.env.GMAIL_USER = "sender@example.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    process.env.EMAIL_FROM_NAME = "FlyerMint";
    const result = await sendPaymentConfirmed({
      to: "buyer@example.com",
      orderId: "FM-1",
      planName: "Pack Starter",
      amountFcfa: 2000,
      mintAmount: 2,
      appUrl: "http://app.test",
    });
    expect(result).toEqual({ ok: true, messageId: "<id@gmail>" });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: "sender@example.com", pass: "abcdefghijklmnop" },
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "FlyerMint <sender@example.com>",
        to: "buyer@example.com",
        subject: "Paiement confirmé, FM-1",
      }),
    );
  });

  it("keeps the app password out of errors and logs", async () => {
    const secret = "super-secret-app-password";
    process.env.GMAIL_USER = "sender@example.com";
    process.env.GMAIL_APP_PASSWORD = secret;
    sendMail.mockRejectedValue(Object.assign(new Error(`Invalid login: ${secret}`), { code: "EAUTH" }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await sendImportantNotice({
      to: "owner@example.com",
      subject: "Note\nsecrete",
      text: "Bonjour",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.includes(secret)).toBe(false);
    expect(errorSpy.mock.calls.flat().join(" ").includes(secret)).toBe(false);
    expect(sendMail.mock.calls[0][0].subject).toBe("Note secrete");
    errorSpy.mockRestore();
  });

  it("rejects a broken recipient before opening SMTP", async () => {
    process.env.GMAIL_USER = "sender@example.com";
    process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
    const result = await sendTicketCreated({
      to: "pas une adresse",
      ticketId: "T-1",
      subject: "Aide",
      message: "Bonjour",
    });
    expect(result).toEqual({ ok: false, error: "MAIL_RECIPIENT_INVALID" });
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("reports SMTP verify failures without the password", async () => {
    process.env.GMAIL_USER = "sender@example.com";
    process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
    verify.mockRejectedValue(Object.assign(new Error("Invalid login: abcdefghijklmnop"), { code: "EAUTH", responseCode: 535 }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await verifyMailTransport();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.includes("abcdefghijklmnop")).toBe(false);
      expect(result.error.startsWith("EAUTH")).toBe(true);
    }
    errorSpy.mockRestore();
  });

  it("escapes html and covers generation failure copy", async () => {
    process.env.GMAIL_USER = "sender@example.com";
    process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
    await sendGenerationFailed({
      to: "buyer@example.com",
      title: `<script>alert("x")</script>`,
      generationId: "gen-1",
      appUrl: "http://app.test",
    });
    const html = sendMail.mock.calls[0][0].html as string;
    expect(html.includes("<script>")).toBe(false);
    expect(html.includes("&lt;script&gt;")).toBe(true);
    expect(escapeHtml(`<b>`)).toBe("&lt;b&gt;");
  });

  it("redacts a password even when the error text contains it", () => {
    const secret = "super-secret-app-password";
    expect(redactMailError(new Error(`auth ${secret} refused`), secret).includes(secret)).toBe(false);
  });

  it("writes the payment facts into the message", () => {
    const content = paymentConfirmedMessage({
      orderId: "FM-9",
      planName: "Pack Starter",
      amountFcfa: 2000,
      mintAmount: 2,
      appUrl: "http://app.test",
    });
    expect(content.text.includes("2000 FCFA")).toBe(true);
    expect(content.text.includes("http://app.test/dashboard")).toBe(true);
  });
});
