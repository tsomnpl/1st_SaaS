import { describe, expect, it } from "vitest";
import { createBriefSchema } from "./flyermint";
import {
  applyPersonalReferenceAccess,
  classifyGenerationAssets,
  enrichArtDirectionWithPersonalReference,
  orderedBitmapAttachments,
  parsePersonalReferenceAnalysis,
  PERSONAL_REFERENCE_GENERATION_BLOCK,
  PERSONAL_REFERENCE_PLAN_CODES,
  planCodeAllowsPersonalReference,
  standardGenerationPlans,
} from "./personal-reference";
import { buildArtDirection, buildPrompt } from "./flyermint";
import { paidPlans } from "./plans";
import { generationFailurePayload, publicErrorMessage } from "./errors";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function brief(overrides: Record<string, unknown> = {}) {
  return createBriefSchema.parse({
    visualType: "Affiche",
    domain: "Restauration",
    objective: "Faire commander",
    targetAudience: "Familles",
    title: "Menu du soir",
    price: "5 000 FCFA",
    format: "affiche_a4",
    colors: ["#111827", "#20C997"],
    adaptiveData: {},
    ...overrides,
  });
}

describe("personal reference access — tests 1-13", () => {
  it("keeps standard generation available on every paid pack (tests 1-6, 10)", () => {
    const packs = standardGenerationPlans();
    expect(packs.map((plan) => plan.priceFcfa)).toEqual([2000, 5000, 10000, 15000, 20000, 25000]);
    for (const plan of packs) {
      const access = applyPersonalReferenceAccess(brief({ creationMode: "idea" }), planCodeAllowsPersonalReference(plan.code));
      expect(access.personalReferenceUsed).toBe(false);
      expect(access.personalReferenceDenied).toBe(false);
      expect(access.brief.personalReferenceUrl).toBeUndefined();
      const prompt = buildPrompt(access.brief, buildArtDirection(access.brief));
      expect(prompt).not.toContain("PERSONAL VISUAL REFERENCE");
      expect(prompt).toMatch(/1\. DOMAIN/);
      expect(prompt).toMatch(/HUMAN SUBJECT/);
    }
  });

  it("allows 20k/25k to generate with a personal poster (tests 7-8)", () => {
    for (const code of PERSONAL_REFERENCE_PLAN_CODES) {
      expect(planCodeAllowsPersonalReference(code)).toBe(true);
      const access = applyPersonalReferenceAccess(
        brief({ creationMode: "idea", personalReferenceUrl: TINY_PNG }),
        true,
      );
      expect(access.personalReferenceUsed).toBe(true);
      expect(access.personalReferenceDenied).toBe(false);
      const ad = buildArtDirection(access.brief);
      const prompt = buildPrompt(access.brief, ad, { personalReference: null });
      expect(prompt).toContain(PERSONAL_REFERENCE_GENERATION_BLOCK);
      expect(prompt).toContain("transpose the composition");
      expect(prompt).toContain("FlyerMint internal library still informs craft");
    }
  });

  it("strips a personal poster on 15k and keeps standard generation (test 9)", () => {
    expect(planCodeAllowsPersonalReference("PACK_15K")).toBe(false);
    const access = applyPersonalReferenceAccess(
      brief({ creationMode: "product", personalReferenceUrl: TINY_PNG, mainImageUrl: TINY_PNG }),
      false,
    );
    expect(access.personalReferenceDenied).toBe(true);
    expect(access.personalReferenceUsed).toBe(false);
    expect(access.brief.personalReferenceUrl).toBeUndefined();
    expect(access.brief.mainImageUrl).toBe(TINY_PNG);
    const prompt = buildPrompt(access.brief, buildArtDirection(access.brief));
    expect(prompt).not.toContain("PERSONAL VISUAL REFERENCE");
    expect(prompt).toContain("USER_PRODUCT");
  });

  it("refuses Mode 7 without a 20k/25k entitlement before any mint would be taken", () => {
    expect(() =>
      applyPersonalReferenceAccess(brief({ creationMode: "reference_reproduction", personalReferenceUrl: TINY_PNG }), false),
    ).toThrow("PERSONAL_REFERENCE_PREMIUM");
    expect(generationFailurePayload(new Error("PERSONAL_REFERENCE_PREMIUM"))).toMatchObject({
      status: 403,
      body: { ok: false, error: "PERSONAL_REFERENCE_PREMIUM" },
    });
    expect(publicErrorMessage(new Error("PERSONAL_REFERENCE_PREMIUM"))).toMatch(/20 000 FCFA/);
    expect(publicErrorMessage(new Error("PERSONAL_REFERENCE_PREMIUM"))).toMatch(/génération standard/);
  });

  it("requires a personal poster only when Mode 7 is entitled", () => {
    expect(() =>
      applyPersonalReferenceAccess(brief({ creationMode: "reference_reproduction" }), true),
    ).toThrow("PERSONAL_REFERENCE_REQUIRED");
  });

  it("distinguishes personal reference, logo and product (tests 11-12)", () => {
    const input = brief({
      creationMode: "reference_reproduction",
      personalReferenceUrl: TINY_PNG,
      mainImageUrl: `data:image/jpeg;base64,${"A".repeat(16)}`,
      logoUrl: `data:image/webp;base64,${"B".repeat(16)}`,
      secondaryImageUrl: `data:image/png;base64,${"C".repeat(16)}`,
    });
    const access = applyPersonalReferenceAccess(input, true);
    const roles = classifyGenerationAssets(access.brief);
    expect(roles).toEqual([
      { role: "PERSONAL_REFERENCE", present: true },
      { role: "USER_PRODUCT", present: true },
      { role: "USER_LOGO", present: true },
      { role: "SECONDARY", present: true },
    ]);
    const attachments = orderedBitmapAttachments(access.brief, "data:image/png;base64,INTERNAL");
    expect(attachments.map((item) => item.role)).toEqual([
      "PERSONAL_REFERENCE",
      "USER_PRODUCT",
      "USER_LOGO",
      "SECONDARY",
    ]);
    expect(attachments[0]?.dataUrl).toBe(TINY_PNG);
    expect(attachments.some((item) => item.role === "FLYERMINT_INTERNAL")).toBe(false);
  });

  it("keeps the single-bitmap standard attach order (test 13)", () => {
    expect(orderedBitmapAttachments(brief({ mainImageUrl: TINY_PNG }), "data:image/png;base64,INTERNAL")).toEqual([
      { role: "USER_PRODUCT", dataUrl: TINY_PNG },
    ]);
    expect(orderedBitmapAttachments(brief({ logoUrl: TINY_PNG }), "data:image/png;base64,INTERNAL")).toEqual([
      { role: "USER_LOGO", dataUrl: TINY_PNG },
    ]);
    expect(orderedBitmapAttachments(brief(), "data:image/png;base64,INTERNAL")).toEqual([
      { role: "FLYERMINT_INTERNAL", dataUrl: "data:image/png;base64,INTERNAL" },
    ]);
    expect(orderedBitmapAttachments(brief(), "")).toEqual([]);
  });

  it("does not move internal FlyerMint references to premium plans", () => {
    const standard = brief({ creationMode: "idea" });
    const ad = buildArtDirection(standard);
    expect(ad.visual_reference_ids.length).toBeGreaterThan(0);
    const premium = brief({ creationMode: "idea", personalReferenceUrl: TINY_PNG });
    const enriched = enrichArtDirectionWithPersonalReference(buildArtDirection(premium), {
      format: "portrait 3:4",
      composition: "spectator looks through a packaging opening, character behind the die-cut",
      framing: "low angle medium shot",
      perspective: "low urban perspective",
      hierarchy: ["opening", "character", "bottom banner"],
      colors: ["deep red", "night"],
      typography: "giant title, small meta",
      borders: "thick lateral frames",
      depth: "foreground package, mid character, city behind",
      graphicElements: ["die-cut window", "side borders"],
      subjectPlacement: "center, behind the opening",
      negativeSpace: "quiet lower third",
    });
    expect(enriched.visual_reference_ids).toEqual(ad.visual_reference_ids);
    expect(enriched.composition).toMatch(/packaging opening/);
    expect(enriched.reference_principles.join(" ")).toMatch(/Internal FlyerMint references remain active/);
    expect(enriched.reference_principles.join(" ")).toMatch(/not added to the FlyerMint global library/);
  });

  it("parses composition grammar instead of commercial content", () => {
    const parsed = parsePersonalReferenceAnalysis(
      JSON.stringify({
        format: "portrait",
        composition: "viewer looks through a carton window",
        framing: "close",
        perspective: "eye-level",
        hierarchy: ["window", "face", "banner"],
        colors: ["kraft", "red"],
        typography: "stacked left",
        borders: "printed carton edges",
        depth: "package in front of talent",
        graphicElements: ["window", "barcode zone"],
        subjectPlacement: "behind opening",
        negativeSpace: "right of window",
      }),
    );
    expect(parsed?.composition).toMatch(/carton window/);
    expect(parsed?.borders).toMatch(/carton edges/);
    expect(parsePersonalReferenceAnalysis("not json")).toBeNull();
  });

  it("keeps 20k/25k as the only personal-reference packs", () => {
    expect(PERSONAL_REFERENCE_PLAN_CODES).toEqual(["PACK_20K", "PACK_25K"]);
    expect(paidPlans().filter((plan) => planCodeAllowsPersonalReference(plan.code)).map((plan) => plan.priceFcfa)).toEqual([
      20000, 25000,
    ]);
    expect(planCodeAllowsPersonalReference("STARTER_2K")).toBe(false);
    expect(planCodeAllowsPersonalReference("PACK_5K")).toBe(false);
    expect(planCodeAllowsPersonalReference("PACK_10K")).toBe(false);
    expect(planCodeAllowsPersonalReference("FREE")).toBe(false);
  });
});
