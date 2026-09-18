import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { publicErrorMessage } from "./errors";
import { createBriefSchema } from "./flyermint";
import { z } from "zod";

const mintAdjustSchema = z.object({
  targetUserId: z.string().min(3),
  amount: z.number().int().refine((n) => n !== 0),
  reason: z.string().min(2),
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
  });

  it("rejects mint balance overwrite payloads", () => {
    expect(() => mintAdjustSchema.parse({ balance: 999999 })).toThrow();
    expect(() =>
      mintAdjustSchema.parse({ targetUserId: "usr_1", amount: 5, reason: "bonus" }),
    ).not.toThrow();
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
