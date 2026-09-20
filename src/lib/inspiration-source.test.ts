import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  analysesFromIndex,
  formatInspirationForPrompt,
  pickInspirationAnalyses,
  publicArtDirection,
} from "./inspiration-source";
import { buildArtDirection, buildPrompt, createBriefSchema } from "./flyermint";

const sample = {
  domaine: "restauration",
  items: [
    {
      id: "aaa-111",
      analysis: {
        arriere_plan: "fond sombre chaleureux",
        textes: "titre haut, prix bas droite",
        visuel: "plat en gros plan",
        palette_dominante: ["#1A1208", "#E8B86D"],
        style_general: "appetissant contraste fort",
      },
    },
    {
      id: "bbb-222",
      analysis: {
        arriere_plan: "texture papier",
        textes: "bandeau central",
        visuel: "ingredient heros",
        palette_dominante: ["#F4EDE4", "#7A1F1F"],
        style_general: "editorial",
      },
    },
  ],
};

describe("inspiration source descriptions", () => {
  it("picks at most 3 analyses and formats them without public URLs", () => {
    const items = analysesFromIndex("restauration", sample);
    expect(items).toHaveLength(2);
    const picked = pickInspirationAnalyses(items, 3);
    const lines = formatInspirationForPrompt(picked);
    const blob = lines.join("\n");
    expect(blob).toMatch(/insp-aaa-111/);
    expect(blob).toMatch(/Never reproduce a logo/);
    expect(blob).not.toMatch(/object\/public/);
    expect(blob).not.toMatch(/storage_path/);
  });

  it("injects library text into the Rodium prompt without exposing the source image", () => {
    const brief = createBriefSchema.parse({
      visualType: "Affiche",
      domain: "Restauration",
      objective: "Attirer le soir",
      targetAudience: "Familles",
      title: "Menu du weekend",
      format: "instagram_post",
      creativeFreedom: "liberte_guidee",
      colors: ["#111827"],
      adaptiveData: {},
    });
    const library = analysesFromIndex("restauration", sample);
    const ad = buildArtDirection(brief, library);
    const prompt = buildPrompt(brief, ad);
    expect(ad.reference_ids.some((id) => id.startsWith("insp-"))).toBe(true);
    expect(prompt).toMatch(/Never reproduce a logo|Do not copy any reference/);
    expect(prompt).toMatch(/Internal style library|style=appetissant/);
    expect(prompt).not.toMatch(/object\/public\/inspirations-source/);
    expect(JSON.stringify(ad)).not.toMatch(/storage\/v1\/object\/public/);
  });

  it("exposes only a count of library refs to the client", () => {
    const pub = publicArtDirection({
      differentiators: ["CTA visible"],
      reference_ids: ["playbook-restauration", "insp-aaa", "insp-bbb"],
    });
    expect(pub.library_refs).toBe(2);
    expect(JSON.stringify(pub)).not.toMatch(/object\/public|storage_path|inspirations-source/);
  });

  it("keeps the analyzer off the public tree", () => {
    const script = readFileSync("scripts/analyze-inspirations.py", "utf8");
    expect(script).toContain("_analysis");
    expect(script).toContain("google/gemini-2.5-flash-lite");
    expect(script).not.toContain("/object/public/");
    expect(script).toContain("NEVER copy visible words");
    expect(script).toContain("catalogue-description-guide.json");
    const guide = JSON.parse(readFileSync("src/lib/catalogue-description-guide.json", "utf8"));
    expect(guide.source_pdf).toBe("docs/inspirations/catalogue-analyse-affiches.pdf");
    expect(guide.exemples.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(guide)).not.toMatch(/zara|fulixgold|nexora|sendora|godfactor|hotels\.ng/i);
  });
});
