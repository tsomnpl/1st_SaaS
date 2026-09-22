import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXTRA_SHOWCASE_SHEETS, SHOWCASE_ORDER, SHOWCASE_SHEETS } from "./showcase-sheets";
import { buildShowcasePrompt, designFor, EXTRA_SHOWCASE_DESIGN, SHOWCASE_DESIGN, supabaseDomainForSheet } from "./showcase-design";

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

  it("adds 8 extra gallery posters without changing the official catalogue", () => {
    const extras = EXTRA_SHOWCASE_SHEETS;
    expect(extras).toHaveLength(8);
    expect(extras.map((sheet) => sheet.id)).toEqual([
      "mariage-01",
      "anniversaire-01",
      "emploi-01",
      "agriculture-01",
      "automobile-01",
      "musique-01",
      "culture-01",
      "services-01",
    ]);
    expect(EXTRA_SHOWCASE_DESIGN).toHaveLength(8);
    expect(EXTRA_SHOWCASE_DESIGN.map((row) => row.id)).toEqual(extras.map((sheet) => sheet.id));
    const banned = /zara|nexora|techpoint|hotels\.ng|godfactor|sendora|fulixgold/i;
    for (const sheet of extras) {
      expect(supabaseDomainForSheet(sheet.id)).toMatch(/^[a-z0-9-]+$/);
      expect(designFor(sheet.id)?.id).toBe(sheet.id);
      expect(sheet.prompt).toMatch(/photoreal/i);
      expect(sheet.titre_affiche_finale).not.toMatch(banned);
      expect(sheet.prompt).not.toMatch(banned);
    }
    expect(supabaseDomainForSheet("mariage-01")).toBe("mariage");
    expect(supabaseDomainForSheet("culture-01")).toBe("religion-culture");
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

  it("generates Gemini posters over chat completions to use the main RODI wallet", () => {
    const script = readFileSync("scripts/generate-showcase.mts", "utf8");
    expect(script).toContain('/images/generations');
    expect(script).toContain('/chat/completions');
    expect(script).toContain('1024x1536');
    expect(script).toContain('"x-api-key"');
    expect(script).toContain("inspirations-source");
    expect(script).toContain("previous.visual_ref_used");
    expect(script).toContain("not 4K");
    expect(script).toContain("extractGeneratedImageUrl");
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

  it("maps every catalogue sheet onto a Supabase inspiration domain", () => {
    for (const sheet of SHOWCASE_SHEETS) {
      expect(supabaseDomainForSheet(sheet.id)).toMatch(/^[a-z0-9-]+$/);
    }
    expect(supabaseDomainForSheet("restauration-03")).toBe("restauration");
    expect(supabaseDomainForSheet("immobilier-business-04")).toBe("finance");
    expect(supabaseDomainForSheet("sante-tourisme-associations-02")).toBe("tourisme");
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
      expect(prompt).toMatch(/Do NOT copy logos, brand names/i);
      expect(prompt).toMatch(/COMPOSITION MODEL/i);
      expect(buildShowcasePrompt(sheet, false)).toMatch(/Every visible word must be correctly spelled/i);
      expect(prompt).toContain(sheet.titre_affiche_finale);
      expect(prompt).toMatch(/photoreal human/i);
      expect(prompt).not.toMatch(/zara|nexora|fulixgold|techpoint/i);
    }
  });

  it("requests max poster size, Gemini bitmap refs, and GPT Image only for already-liked posters", () => {
    const script = readFileSync("scripts/generate-showcase.mts", "utf8");
    expect(script).toContain('|| "openai/gpt-image-2"');
    expect(script).toContain("lanczos3");
    expect(script).toContain("page_reference_pdf");
    expect(script).toContain("body.image");
    expect(script).toContain("storage/masters");
    expect(script).toContain("isGptImageModel");
    expect(script).toContain("fetchSupabaseReference");
    expect(script).toContain("google/gemini-3.1-flash-lite-image");
    expect(script).toContain("retry_text_only");
    expect(script).toContain("allowBitmapAttach");
    expect(script).toContain("image_url");
    expect(script).toContain("EXTRA_SHOWCASE_SHEETS");
    expect(script).toContain("RODIUM_API_KEY");
    expect(script).not.toContain('|| "openai/gpt-image-1"');
  });

  it("retries Gemini without attaching the bitmap when the provided quota is empty", () => {
    const rodium = readFileSync("src/server/rodium.ts", "utf8");
    expect(rodium).toContain("postGeminiImage");
    expect(rodium).toContain("isProvidedQuotaError");
    expect(rodium).toContain("bitmapAttached");
  });
});
