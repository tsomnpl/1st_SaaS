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
