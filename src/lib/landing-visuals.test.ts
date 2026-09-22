import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { DOMAINS } from "./domains";
import { getLandingVisuals } from "./landing-visuals";
import { isSafeCreationAsset } from "./creation-assets";
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
    expect(visuals.afterPoster?.id).toMatch(/^restauration-(burger|03)$/);
    expect(visuals.afterPoster?.id).not.toBe("restauration-01");
    expect(visuals.realPosters.map((poster) => poster.id).slice(0, 3)).toEqual(
      ["restauration-burger", "restauration-03", "mode-03"].filter((id) =>
        visuals.realPosters.some((poster) => poster.id === id),
      ),
    );
    expect(visuals.realPosters.some((poster) => poster.id === "restauration-03")).toBe(true);
    expect(visuals.realPosters.some((poster) => poster.id === "mode-03")).toBe(true);
    expect(visuals.showcase.map((poster) => poster.id)).toEqual(
      visuals.showcase.map((poster) => poster.id).filter((id, index, all) => all.indexOf(id) === index),
    );
    expect(visuals.heroPosters.map((poster) => poster.id)).toEqual(
      ["evenementiel-01", "evenementiel-02", "restauration-03", "mode-03", "beaute-03", "immobilier-business-01", "immobilier-business-03", "techno-education-03", "sport-finance-01", "sante-tourisme-associations-02"].filter(
        (id) => visuals.realPosters.some((poster) => poster.id === id),
      ),
    );
    expect(visuals.domains.length).toBeGreaterThan(0);
    expect(visuals.domains.length).toBeLessThanOrEqual(DOMAINS.length);
    expect(visuals.domains.every((item) => Boolean(item.poster))).toBe(true);
    for (const item of visuals.domains) {
      expect(item.poster.imageSrc.startsWith("/creations/")).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", item.poster.imageSrc.replace(/^\//, "")))).toBe(true);
    }
  });

  it("serves gallery webps safely and 404s missing files instead of crashing", () => {
    expect(isSafeCreationAsset("evenementiel-01.webp")).toBe(true);
    expect(isSafeCreationAsset("hero/evenementiel-01.webp")).toBe(true);
    expect(isSafeCreationAsset("../package.json")).toBe(false);
    expect(isSafeCreationAsset("evenementiel-01.png")).toBe(false);
    expect(isSafeCreationAsset("")).toBe(false);
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
