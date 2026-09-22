import { describe, expect, it } from "vitest";
import { applyVisualLibrary, buildArtDirection, buildPrompt, createBriefSchema, scoreQuality } from "./flyermint";
import type { CreativeDna } from "./creative-dna";

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
    expect(brief.creationMode).toBe("idea");
    expect(brief.personalReferenceUrl).toBeUndefined();
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
    expect(ad.human.role.length).toBeGreaterThan(3);
    const prompt = buildPrompt(brief, ad);
    expect(prompt).toMatch(/HUMAN SUBJECT/);
    expect(prompt).toMatch(/photoreal person/);
    expect(prompt).toContain("Masterclass Business");
    expect(ad.visual_reference_ids.length).toBeGreaterThan(0);
    expect(ad.color_palette).toEqual(["#111827", "#20C997", "#DFFAF0"]);
    expect(prompt).toMatch(/1\. DOMAIN/);
    expect(prompt).toMatch(/7\. HUMAN SUBJECT/);
    expect(prompt).toMatch(/16\. QUALITY CONTROL/);
  });

  it("applies visual library DNA without dropping client facts", () => {
    const brief = createBriefSchema.parse({
      visualType: "Affiche",
      domain: "Restauration",
      objective: "Faire commander",
      targetAudience: "Familles",
      title: "Menu du soir",
      price: "5 000 FCFA",
      format: "affiche",
      colors: ["#0f172a", "#2563eb"],
      adaptiveData: {},
    });
    const dna: CreativeDna = {
      referenceId: "ref-resto-1",
      domain: "Restauration",
      background: "dark kitchen with warm key light",
      composition: "person right, giant title left, price large, CTA bottom",
      layout: "split vertical 40/60",
      humanPlacement: "right third, waist-up",
      subjectScale: "large, waist-up",
      textPosition: "left column",
      titleHierarchy: "giant title, then price, then meta",
      humanRole: "chef plating",
      imageTreatment: "warm food photography",
      typographyHierarchy: "display title, bold price, small meta",
      colorPalette: ["dark ground", "white type", "red accent"],
      contrast: "high",
      spacing: "safe 6%",
      whiteSpace: "left of subject",
      margins: "6% all sides",
      safeZone: "keep type inside 6%",
      ctaPosition: "bottom center",
      pricePosition: "mid-left, large",
      mood: "appetizing",
      visualDensity: "medium",
      aspectRatio: "3:4",
    };
    const ad = applyVisualLibrary(
      buildArtDirection(brief),
      {
        source: "supabase",
        referenceId: "ref-resto-1",
        storagePath: "restauration/sample.jpg",
        dna,
        principles: ["Keep the split layout."],
      },
      brief.colors,
    );
    expect(ad.visual_reference_ids[0]).toBe("ref-resto-1");
    expect(ad.composition).toMatch(/person right/);
    expect(ad.color_palette).toEqual(["#0f172a", "#2563eb"]);
    const prompt = buildPrompt(brief, ad, { hasVisualReferenceImage: true, dna });
    expect(prompt).toMatch(/bitmap is attached/);
    expect(prompt).toContain("Menu du soir");
    expect(prompt).toContain("5 000 FCFA");
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
