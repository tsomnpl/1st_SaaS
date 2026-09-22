import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { publicErrorMessage, generationFailurePayload } from "./errors";
import { SECURITY_HEADERS } from "./security-headers";
import { createBriefSchema } from "./flyermint";
import { z } from "zod";

const mintAdjustSchema = z.object({
  targetUserId: z.string().min(3).max(80),
  amount: z.number().int().min(-500).max(500).refine((n) => n !== 0),
  reason: z.string().min(2).max(240),
});

function walk(dir: string, acc: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", ".next", "docs"].includes(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

describe("security helpers", () => {
  it("never returns raw secrets in public errors", () => {
    expect(publicErrorMessage(new Error("RODIUMAI_API_KEY_MISSING"))).not.toMatch(/sk_|rodium|secret/i);
    expect(publicErrorMessage(new Error("CLERK_SECRET_KEY"))).toBe(
      "Une erreur est survenue. Réessaie dans un instant.",
    );
    expect(publicErrorMessage(new Error("RODIUM_INSUFFICIENT_BALANCE"))).toMatch(/crédits Rodium/i);
    expect(publicErrorMessage(new Error("RODIUM_IMAGES_FAILED_402"))).toBe(
      publicErrorMessage(new Error("RODIUM_INSUFFICIENT_BALANCE")),
    );
    expect(publicErrorMessage(new Error("La génération a échoué. Ton Mint n’a pas été débité."))).toBe(
      "La génération a échoué. Ton Mint n’a pas été débité.",
    );
    expect(generationFailurePayload(new Error("RODIUM_IMAGES_FAILED_402"))).toMatchObject({
      status: 402,
      body: { ok: false, error: "RODIUM_INSUFFICIENT_BALANCE" },
    });
    expect(generationFailurePayload(new Error("GENERATION_FAILED")).status).toBe(400);
  });

  it("rejects mint balance overwrite payloads", () => {
    expect(() => mintAdjustSchema.parse({ balance: 999999 })).toThrow();
    expect(() =>
      mintAdjustSchema.parse({ targetUserId: "usr_1", amount: 5, reason: "bonus" }),
    ).not.toThrow();
    expect(() =>
      mintAdjustSchema.parse({ targetUserId: "usr_1", amount: 999999, reason: "hack" }),
    ).toThrow();
  });

  it("rejects unsafe image payloads", () => {
    expect(() =>
      createBriefSchema.parse({
        visualType: "Affiche",
        domain: "Technologie",
        objective: "Vendre",
        targetAudience: "PME",
        title: "Promo",
        format: "carre",
        mainImageUrl: "javascript:alert(1)",
      }),
    ).toThrow();
  });

  it("rejects privilege-escalation payloads on user status", () => {
    const statusSchema = z.object({
      targetUserId: z.string().min(3),
      status: z.enum(["ACTIVE", "SUSPENDED"]),
      reason: z.string().min(2),
    });
    expect(() =>
      statusSchema.parse({ targetUserId: "usr_1", status: "ADMIN", reason: "hack" }),
    ).toThrow();
    expect(() =>
      statusSchema.parse({ targetUserId: "usr_1", role: "ADMIN", status: "ACTIVE", reason: "ok" }),
    ).not.toThrow();
  });

  it("allows Clerk CAPTCHA (Cloudflare Turnstile) in CSP", () => {
    const csp = SECURITY_HEADERS["Content-Security-Policy"];
    expect(csp).toMatch(/script-src[^;]*challenges\.cloudflare\.com/);
    expect(csp).toMatch(/script-src[^;]*\*\.protect\.clerk\.com/);
    expect(csp).toMatch(/connect-src[^;]*\*\.protect\.clerk\.com:\*/);
    expect(csp).toMatch(/frame-src[^;]*challenges\.cloudflare\.com/);
    expect(csp).toMatch(/frame-src[^;]*\*\.protect\.clerk\.com/);
    expect(csp).toMatch(/worker-src[^;]*'self' blob:/);
  });

  it("does not commit live-looking secrets", () => {
    const files = walk("/workspace").filter((file) =>
      /\.(ts|tsx|js|json|md|env|example)$/.test(file),
    );
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (/sk_live_[A-Za-z0-9]{20,}/.test(text)) hits.push(file);
      if (/sk_test_[A-Za-z0-9]{24,}/.test(text) && !file.endsWith(".md")) hits.push(file);
    }
    expect(hits).toEqual([]);
  });
});
