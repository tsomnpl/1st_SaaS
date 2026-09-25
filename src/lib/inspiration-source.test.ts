import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  analysesFromIndex,
  formatInspirationForPrompt,
  pickInspirationAnalyses,
  publicArtDirection,
  rankReferenceAnalyses,
  referenceSlugsForBrief,
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

  it("looks in the Formation folder when an Evenementiel brief is about a training", () => {
    const slugs = referenceSlugsForBrief("Evenementiel", "Formation Place limité Réduction de 50%");
    expect(slugs.own).toBe("evenementiel");
    expect(slugs.inferred).toContain("education");
    expect(referenceSlugsForBrief("Restauration", "Menu du weekend").inferred).toEqual([]);
  });

  it("ranks the reference closest to the brief first instead of the first id", () => {
    const items = [
      { id: "aaa", domaine: "evenementiel", visuel: "homme dansant avec des masques", textes: "titre doré", palette_dominante: [], style_general: "festif", arriere_plan: "sombre" },
      { id: "zzz", domaine: "education", visuel: "jeune femme souriante tenant des dossiers", textes: "titre en haut, blocs d'informations", palette_dominante: [], style_general: "professionnel", arriere_plan: "clair" },
    ];
    const ranked = rankReferenceAnalyses(items, "Formation professionnelle dossiers", {
      own: "evenementiel",
      inferred: ["education"],
      random: () => 0.5,
    });
    expect(ranked[0].id).toBe("zzz");
  });

  it("does not always reuse the same reference when scores tie", () => {
    const items = ["a", "b", "c"].map((id) => ({
      id, domaine: "sport", visuel: "", textes: "", palette_dominante: [], style_general: "", arriere_plan: "",
    }));
    const values = [0.9, 0.1, 0.5];
    let i = 0;
    const ranked = rankReferenceAnalyses(items, "", { random: () => values[i++] });
    expect(ranked[0].id).toBe("b");
  });

  it("builds a copy-and-replace prompt when the reference bitmap is attached", () => {
    const brief = createBriefSchema.parse({
      visualType: "Affiche",
      domain: "Evenementiel",
      objective: "Attirer du monde",
      targetAudience: "Jeunes",
      title: "Formation",
      date: "12 décembre",
      price: "5000",
      cta: "Réserve mtn",
      format: "instagram_post",
      colors: [],
      adaptiveData: {},
    });
    const prompt = buildPrompt(brief, buildArtDirection(brief), { hasVisualRef: true });
    expect(prompt).toMatch(/EDIT THE ATTACHED POSTER/);
    expect(prompt).toMatch(/every font/);
    expect(prompt).toMatch(/rectangles, slanted bands/);
    expect(prompt).toMatch(/Keep the reference colors exactly/);
    expect(prompt).toContain("Title: Formation");
    expect(prompt).toContain("Date (exact): 12 décembre");
    expect(prompt).not.toMatch(/Maximum 2-3 main colors/);
    expect(prompt).not.toMatch(/#6D28D9|#10B981/);
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
    expect(script).toContain("google/gemini-3.1-flash-lite");
    expect(script).not.toContain("google/gemini-2.5-flash-lite");
    expect(script).not.toContain("/object/public/");
    expect(script).toContain("NEVER copy visible words");
    expect(script).toContain("catalogue-description-guide.json");
    const guide = JSON.parse(readFileSync("src/lib/catalogue-description-guide.json", "utf8"));
    expect(guide.source_pdf).toBe("docs/inspirations/catalogue-analyse-affiches.pdf");
    expect(guide.exemples.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(guide)).not.toMatch(/zara|fulixgold|nexora|sendora|godfactor|hotels\.ng/i);
  });
});
