import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { DOMAINS } from "./domains";
import { getLandingVisuals } from "./landing-visuals";
import { SUPABASE_DOMAIN_BY_APP } from "./inspiration-domains";
import { dnaHasStructure, parseCreativeDna } from "./creative-dna";

describe("landing visuals", () => {
  it("only exposes posters whose files exist on disk", async () => {
    const visuals = await getLandingVisuals();
    expect(visuals.realPosters.length).toBeGreaterThan(0);
    expect(visuals.showcase.length).toBeGreaterThan(0);
    expect(visuals.heroPosters.length).toBeGreaterThanOrEqual(3);
    for (const poster of [...visuals.realPosters, ...visuals.heroPosters, ...visuals.showcase]) {
      expect(poster.imageSrc.startsWith("/creations/")).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", poster.imageSrc.replace(/^\//, "")))).toBe(true);
    }
    expect(visuals.domains).toHaveLength(DOMAINS.length);
    const withImage = visuals.domains.filter((item) => item.poster);
    const empty = visuals.domains.filter((item) => !item.poster);
    expect(withImage.length).toBeGreaterThan(0);
    expect(withImage.length + empty.length).toBe(DOMAINS.length);
  });
});

describe("inspiration domains", () => {
  it("maps every FlyerMint domain onto a supabase key", () => {
    for (const domain of DOMAINS) {
      expect(SUPABASE_DOMAIN_BY_APP[domain]).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("creative dna", () => {
  it("parses a JSON DNA block and rejects empty structure", () => {
    const dna = parseCreativeDna(
      'note {"composition":"person right, title left","layout":"split","humanPlacement":"right third"}',
      { referenceId: "abc", domain: "Restauration" },
    );
    expect(dna.referenceId).toBe("abc");
    expect(dnaHasStructure(dna)).toBe(true);
    expect(dna.background).toBe("");
    expect(parseCreativeDna("no json", { referenceId: "x", domain: "Mode & Accessoires" }).composition).toBe("");
  });
});
