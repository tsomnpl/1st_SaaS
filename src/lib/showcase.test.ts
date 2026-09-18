import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SHOWCASE_ORDER, SHOWCASE_SHEETS } from "./showcase-sheets";

describe("showcase catalogue alignment", () => {
  it("keeps 27 sheets in catalogue order", () => {
    const catalogue = JSON.parse(
      readFileSync("docs/inspirations/catalogue-extrait.json", "utf8"),
    ) as { count: number; fiches: Array<{ id: string }> };
    expect(catalogue.count).toBe(27);
    expect(catalogue.fiches).toHaveLength(27);
    expect(SHOWCASE_SHEETS).toHaveLength(27);
    expect(SHOWCASE_ORDER).toEqual(catalogue.fiches.map((fiche) => fiche.id));
    expect(SHOWCASE_SHEETS[0].id).toBe("evenementiel-01");
    expect(SHOWCASE_SHEETS[8].id).toBe("mode-01");
    expect(SHOWCASE_SHEETS[26].id).toBe("sante-tourisme-associations-03");
  });

  it("marks 8 to 10 generated posters for the hero loop", () => {
    const manifest = JSON.parse(
      readFileSync("docs/inspirations/showcase-manifest.json", "utf8"),
    ) as { fiches: Array<{ statut: string; hero_loop: boolean; fichier_image: string }> };
    const generated = manifest.fiches.filter((row) => row.statut === "genere" && row.fichier_image);
    const loop = manifest.fiches.filter((row) => row.hero_loop);
    if (generated.length >= 3) {
      expect(loop.length).toBeGreaterThanOrEqual(Math.min(8, generated.length));
      expect(loop.length).toBeLessThanOrEqual(10);
      expect(loop.every((row) => row.statut === "genere")).toBe(true);
    }
  });

  it("generates posters via official Rodium images API only", () => {
    const script = readFileSync("scripts/generate-showcase.mts", "utf8");
    expect(script).toContain('/images/generations');
    expect(script).toContain('1024x1536');
    expect(script).toContain('"x-api-key"');
    expect(script).not.toContain("/chat/completions");
    expect(script).not.toContain("1024x1792");
  });

  it("does not keep real brand names in final titles", () => {
    const banned = /zara|nexora|techpoint|hotels\.ng|godfactor|sendora|fulixgold/i;
    for (const sheet of SHOWCASE_SHEETS) {
      expect(sheet.titre_affiche_finale).not.toMatch(banned);
      expect(sheet.prompt).not.toMatch(banned);
    }
  });
});
