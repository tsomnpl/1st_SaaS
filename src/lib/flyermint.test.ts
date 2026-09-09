import { describe, expect, it } from "vitest";
import { buildArtDirection, buildPrompt, createBriefSchema, scoreQuality } from "./flyermint";

describe("flyermint core", () => {
  it("validates brief and keeps key fields", () => {
    const brief = createBriefSchema.parse({
      visualType: "Affiche",
      domain: "Education & Formation",
      objective: "Generer des inscriptions",
      targetAudience: "Etudiants",
      title: "Formation IA 2026",
      format: "instagram_story",
      creativeFreedom: "liberte_guidee",
      colors: ["#111827", "#20C997"],
      adaptiveData: { formateur: "Coach Pro" },
    });

    expect(brief.title).toBe("Formation IA 2026");
    expect(brief.domain).toBe("Education & Formation");
  });

  it("builds art direction with differentiators", () => {
    const brief = createBriefSchema.parse({
      visualType: "Affiche",
      domain: "Evenementiel",
      objective: "Attirer des clients",
      targetAudience: "Professionnels",
      title: "Masterclass Business",
      format: "carre",
      creativeFreedom: "liberte_guidee",
      colors: [],
      adaptiveData: {},
    });

    const ad = buildArtDirection(brief);
    expect(ad.color_palette.length).toBeGreaterThanOrEqual(2);
    expect(ad.differentiators.length).toBeGreaterThan(0);
  });

  it("computes quality score in expected range", () => {
    const brief = createBriefSchema.parse({
      visualType: "Affiche",
      domain: "Technologie",
      objective: "Vendre",
      targetAudience: "PME",
      title: "Promo SaaS",
      format: "instagram_post",
      creativeFreedom: "liberte_guidee",
      colors: ["#111827", "#20C997"],
      adaptiveData: {},
    });
    const ad = buildArtDirection(brief);
    const prompt = buildPrompt(brief, ad);
    const scores = scoreQuality(brief, prompt);
    expect(scores.overall_score).toBeGreaterThan(0);
    expect(scores.overall_score).toBeLessThanOrEqual(100);
  });
});
