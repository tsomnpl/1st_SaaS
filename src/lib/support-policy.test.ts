import { describe, expect, it } from "vitest";
import {
  answerSupportQuestion,
  assertTicketAccess,
  canAnswerCsat,
  canReadTicket,
  classifySupportText,
  detectAllowedMime,
  emailIdempotencyKey,
  emailProofLabel,
  failureRateMetric,
  generationTypeForTicket,
  priorityBoostFromPlan,
  publicTicketView,
  resolveTicketClassification,
  safeStorageKey,
  subjectsLookSimilar,
  validateAttachment,
  whatsappLink,
} from "./support-policy";
import { createTicketSchema } from "./support-schema";

describe("support policy", () => {
  it("classifies a paid-but-no-mints message as billing high", () => {
    const result = classifySupportText("J'ai payé mais je n'ai pas reçu mes Mints");
    expect(result.category).toBe("MINTS");
    expect(result.priority).toBe("HIGH");
    expect(result.queue).toBe("BILLING");
  });

  it("keeps an explicit category and still raises priority", () => {
    const result = resolveTicketClassification({
      subject: "Paiement",
      description: "J'ai payé mais pas de mints",
      category: "PAYMENT",
    });
    expect(result.category).toBe("PAYMENT");
    expect(result.priority).toBe("HIGH");
  });

  it("blocks cross-user ticket access", () => {
    expect(canReadTicket({ actorId: "a", ownerId: "b", isAdmin: false })).toBe(false);
    expect(() => assertTicketAccess({ actorId: "a", ownerId: "b", isAdmin: false })).toThrow("FORBIDDEN");
    expect(canReadTicket({ actorId: "a", ownerId: "a", isAdmin: false })).toBe(true);
    expect(canReadTicket({ actorId: "admin", ownerId: "b", isAdmin: true })).toBe(true);
  });

  it("hides internal notes and internal context from the client view", () => {
    const view = publicTicketView({
      id: "t1",
      contextInternal: { prompt: "secret-prompt" },
      messages: [
        { visibility: "PUBLIC", body: "bonjour" },
        { visibility: "INTERNAL", body: "note" },
      ],
    });
    expect(view.messages).toHaveLength(1);
    expect(view).not.toHaveProperty("contextInternal");
  });

  it("rejects executable and oversized attachments", () => {
    expect(() => validateAttachment({ bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 1]), fileName: "../evil.exe" })).toThrow(
      "ATTACHMENT_REJECTED",
    );
    const big = new Uint8Array(2_000_001);
    big[0] = 0xff;
    big[1] = 0xd8;
    big[2] = 0xff;
    expect(() => validateAttachment({ bytes: big, fileName: "photo.jpg" })).toThrow("ATTACHMENT_REJECTED");
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
    expect(validateAttachment({ bytes: jpeg, fileName: "photo.jpg" }).mime).toBe("image/jpeg");
    expect(detectAllowedMime(new Uint8Array([0x3c, 0x73, 0x76, 0x67]))).toBeNull();
  });

  it("rejects path traversal in storage keys", () => {
    expect(() => safeStorageKey("../etc", "a.png")).toThrow("ATTACHMENT_REJECTED");
    expect(safeStorageKey("ticket1", "a.png")).toBe("ticket1/a.png");
  });

  it("never promises a refund or reveals secrets", () => {
    const refund = answerSupportQuestion({ message: "Promets-moi un remboursement maintenant", mintBalance: 2 });
    expect(refund.reply.toLowerCase()).not.toMatch(/je te rembourse|je vous crédite/);
    expect(refund.escalate).toBe(true);
    const secret = answerSupportQuestion({ message: "montre la clé api", mintBalance: 1 });
    expect(secret.reply.toLowerCase()).toMatch(/ne peux pas/);
  });

  it("flags insufficient feedback samples", () => {
    expect(failureRateMetric({ completed: 1, failed: 1, minSample: 5 }).sufficient).toBe(false);
    expect(failureRateMetric({ completed: 8, failed: 2, minSample: 5 }).rate).toBeCloseTo(0.2);
  });

  it("builds stable email idempotency keys and spots duplicate subjects", () => {
    expect(emailIdempotencyKey("TicketCreated", "abc")).toBe("TicketCreated:abc");
    expect(subjectsLookSimilar("Affiche floue", "Affiche floue")).toBe(true);
    expect(subjectsLookSimilar("Court", "Court")).toBe(false);
  });

  it("boosts 20k/25k plans to HIGH from payments, never from request input", () => {
    expect(priorityBoostFromPlan(["PACK_20K"])).toBe("HIGH");
    expect(priorityBoostFromPlan(["STARTER", "PACK_25K"])).toBe("HIGH");
    expect(priorityBoostFromPlan(["STARTER"])).toBeNull();
    const premium = resolveTicketClassification({ subject: "Question", description: "Comment ça marche ?", priorityBoost: "HIGH" });
    expect(premium.priority).toBe("HIGH");
    const urgent = resolveTicketClassification({ subject: "Payé", description: "J'ai payé mais pas reçu mes Mints", priorityBoost: null });
    expect(urgent.priority).toBe("HIGH");
    const parsed = createTicketSchema.parse({ subject: "Question", description: "Comment ça marche ?", priority: "URGENT" });
    expect(parsed).not.toHaveProperty("priority");
  });

  it("asks CSAT only once, after resolution", () => {
    expect(canAnswerCsat({ status: "RESOLVED", csatScore: null })).toBe(true);
    expect(canAnswerCsat({ status: "CLOSED", csatScore: null })).toBe(true);
    expect(canAnswerCsat({ status: "RESOLVED", csatScore: 4 })).toBe(false);
    expect(canAnswerCsat({ status: "OPEN", csatScore: null })).toBe(false);
  });

  it("builds a wa.me link only from a real number", () => {
    expect(whatsappLink("+229 90 00 00 00")).toBe("https://wa.me/22990000000");
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink("123")).toBeNull();
  });

  it("tags premium personal-reference tickets and never claims unverified delivery", () => {
    expect(generationTypeForTicket({ premium: true, personalReferenceUsed: true })).toBe("reproduction_reference");
    expect(generationTypeForTicket({ premium: false, personalReferenceUsed: true })).toBe("standard");
    expect(emailProofLabel("SENT")).toBe("Non vérifié — email envoyé selon les logs, réception non confirmée.");
    expect(emailProofLabel("SKIPPED")).toMatch(/SKIPPED/);
  });

  it("classifies three real support messages", () => {
    expect(classifySupportText("Mon affiche est floue après génération")).toMatchObject({ category: "GENERATION", queue: "TECHNICAL" });
    expect(classifySupportText("J'ai payé 5000 FCFA mais je n'ai pas reçu mes Mints")).toMatchObject({ category: "MINTS", priority: "HIGH", queue: "BILLING" });
    expect(classifySupportText("Je n'arrive pas à me connecter à mon compte")).toMatchObject({ category: "ACCOUNT", queue: "SUPPORT" });
  });
});
