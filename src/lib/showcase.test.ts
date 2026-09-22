import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SHOWCASE_ORDER, SHOWCASE_SHEETS } from "./showcase-sheets";
import { pickAfterPoster, pickLandingShowcase, posterForDomaine } from "./showcase";
import { buildShowcasePrompt, SHOWCASE_DESIGN } from "./showcase-design";

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
    expect(SHOWCASE_DESIGN).toHaveLength(27);
    expect(SHOWCASE_DESIGN.map((row) => row.id)).toEqual(SHOWCASE_ORDER);
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

  it("maps catalogue sheets to references.pdf pages without publishing extracts", () => {
    const map = JSON.parse(
      readFileSync("docs/inspirations/reference-page-map.json", "utf8"),
    ) as {
      mapped: number;
      fiches: Array<{ id: string; page_reference_pdf: number | null; local_ref_path?: string }>;
    };
    expect(map.fiches).toHaveLength(27);
    expect(map.fiches.map((row) => row.id)).toEqual(SHOWCASE_ORDER);
    expect(map.mapped).toBeGreaterThanOrEqual(25);
    const gitignore = readFileSync(".gitignore", "utf8");
    expect(gitignore).toContain("storage/private/");
    expect(map.fiches.some((row) => row.local_ref_path?.startsWith("public/"))).toBe(false);
  });

  it("stores style-only reference templates without real brands", () => {
    const catalog = JSON.parse(
      readFileSync("docs/inspirations/references-catalog.json", "utf8"),
    ) as { items: Array<{ id: string; style: string; palette: string[]; imageUrl?: string }> };
    expect(catalog.items).toHaveLength(27);
    const banned = /zara|nexora|techpoint|fulixgold|sendora|godfactor/i;
    for (const item of catalog.items) {
      expect(JSON.stringify(item)).not.toMatch(banned);
      expect(item.palette.length).toBeGreaterThanOrEqual(2);
      expect(item.palette.length).toBeLessThanOrEqual(3);
    }
  });

  it("does not keep real brand names in final titles", () => {
    const banned = /zara|nexora|techpoint|hotels\.ng|godfactor|sendora|fulixgold/i;
    for (const sheet of SHOWCASE_SHEETS) {
      expect(sheet.titre_affiche_finale).not.toMatch(banned);
      expect(sheet.prompt).not.toMatch(banned);
    }
  });

  it("embeds concrete design laws in the Rodium prompt", () => {
    const samples = SHOWCASE_SHEETS.filter((sheet) =>
      ["evenementiel-01", "restauration-03", "immobilier-business-04"].includes(sheet.id),
    );
    expect(samples).toHaveLength(3);
    for (const sheet of samples) {
      const prompt = buildShowcasePrompt(sheet, true);
      expect(prompt).toMatch(/Maximum 2-3 main colors/i);
      expect(prompt).toMatch(/Maximum 2 type families/i);
      expect(prompt).toMatch(/Clear hierarchy/i);
      expect(prompt).toMatch(/Strong contrast/i);
      expect(prompt).toMatch(/Do NOT copy logos|Do NOT copy or near-copy/i);
      expect(buildShowcasePrompt(sheet, false)).toMatch(/Every visible word must be correctly spelled/i);
      expect(prompt).toContain(sheet.titre_affiche_finale);
      expect(prompt).toMatch(/photoreal human/i);
      expect(prompt).not.toMatch(/zara|nexora|fulixgold|techpoint/i);
    }
  });

  it("stages a person in restauration-03 and mode-03", () => {
    const ramen = SHOWCASE_SHEETS.find((sheet) => sheet.id === "restauration-03");
    const closet = SHOWCASE_SHEETS.find((sheet) => sheet.id === "mode-03");
    expect(ramen?.prompt).toMatch(/cook or diner|chopsticks|serving or tasting/i);
    expect(ramen?.prompt).toMatch(/Not a bowl alone/i);
    expect(closet?.sous_titre_affiche_finale).toBe("Élégance assumée");
    expect(closet?.prompt).toMatch(/Élégance assumée/);
    expect(closet?.prompt).not.toMatch(/Braced in beauty/);
    expect(closet?.prompt).toMatch(/Not a product grid without a person/i);
  });

  it("picks real generated posters for the landing showcase", () => {
    const generated = JSON.parse(
      readFileSync("docs/inspirations/showcase-manifest.json", "utf8"),
    ).fiches.filter((row: { statut: string }) => row.statut === "genere");
    const landing = pickLandingShowcase(generated, 8);
    expect(landing.length).toBeGreaterThanOrEqual(8);
    expect(landing.every((row) => row.fichier_image)).toBe(true);
    expect(pickAfterPoster(generated)?.id).toMatch(/restauration/);
    expect(posterForDomaine(generated, "Événementiel")?.id).toMatch(/evenementiel/);
    expect(posterForDomaine(generated, "Entreprise")?.id).toMatch(/immobilier-business/);
    expect(posterForDomaine(generated, "Formation")?.id).toMatch(/techno-education/);
    expect(posterForDomaine(generated, "Mariage")).toBeUndefined();
  });

  it("requests a bitmap-capable model, a measured 4K master, and a real web resize", () => {
    const script = readFileSync("scripts/generate-showcase.mts", "utf8");
    const derivatives = readFileSync("src/lib/poster-derivatives.ts", "utf8");
    expect(script).toContain('|| "openai/gpt-image-2"');
    expect(script).toContain("1024x1536");
    expect(script).toContain("visualRefSent");
    expect(script).toContain("ensureReferenceImage");
    expect(script).toContain("page_reference_pdf");
    expect(script).toContain("body.image");
    expect(script).toContain("isGptImageModel");
    expect(script).toContain("storage/masters");
    expect(script).toContain("-master.webp");
    expect(derivatives).toContain("lanczos3");
    expect(derivatives).toContain("3840");
    expect(script).not.toContain("-4k.webp");
    expect(script).not.toContain("/chat/completions");
    expect(script).not.toContain('|| "openai/gpt-image-1"');
  });
});
