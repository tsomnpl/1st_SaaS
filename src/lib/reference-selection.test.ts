import { describe, expect, it } from "vitest";
import type { CreateBriefInput } from "@/lib/flyermint";
import {
  findLeftovers,
  finalChecklist,
  parseReferenceAnalysis,
  pickReferenceInputs,
  rankDomainReferences,
  slotMapping,
  unplacedClientText,
  type ReferenceAnalysis,
} from "@/lib/reference-selection";
import { buildArtDirection, buildPrompt } from "@/lib/flyermint";
import { applyReferenceCheck, skippedQcReport, type PosterQcReport } from "@/lib/quality-control";
import { collectImageAttachments, EXACT_COPY_MODEL, geminiImageRequestBody } from "@/server/rodium";

const brief = {
  visualType: "Affiche",
  domain: "Education & Formation",
  objective: "Inscriptions",
  targetAudience: "Etudiants",
  title: "Formation Excel",
  cta: "Inscrivez-vous maintenant",
  contactPhone: "+228 90 00 00 00",
  format: "affiche",
  creativeFreedom: "liberte_guidee",
  referenceMode: "exact_copy",
  colors: [],
  adaptiveData: {},
} as unknown as CreateBriefInput;

function analysis(partial: Partial<ReferenceAnalysis>): ReferenceAnalysis {
  return {
    subject: "",
    keywords: [],
    communicationType: "inscription",
    hasPerson: true,
    personCount: 1,
    hasProduct: false,
    ctaType: "telephone",
    textSlots: ["title", "phone", "cta"],
    zones: [],
    originalText: [],
    structureSummary: "",
    aspectRatio: "4:5",
    ...partial,
  };
}

describe("reference selection inside one domain", () => {
  it("ranks the office-software training above other education posters for 'Formation Excel'", () => {
    const ranked = rankDomainReferences(brief, [
      { id: "home", storagePath: "education/home.jpg", analysis: analysis({ subject: "cours à domicile", keywords: ["cours", "domicile", "soutien", "scolaire"] }) },
      { id: "office", storagePath: "education/office.jpg", analysis: analysis({ subject: "formation en bureautique", keywords: ["formation", "excel", "word", "bureautique"] }) },
      { id: "raw", storagePath: "education/raw.jpg", analysis: null },
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["office", "home", "raw"]);
    expect(ranked[0].reason).toMatch(/formation/);
    expect(ranked[2].score).toBe(-1);
  });

  it("parses a vision analysis and ignores unknown slots", () => {
    const parsed = parseReferenceAnalysis('```json\n{"subject":"formation","keywords":["Excel"],"textSlots":["title","foo","price"],"zones":[{"role":"main_visual","position":"left 35%"}]}\n```');
    expect(parsed?.textSlots).toEqual(["title", "price"]);
    expect(parsed?.keywords).toEqual(["excel"]);
    expect(parsed?.zones[0]).toMatchObject({ role: "main_visual", position: "left 35%" });
  });
});

describe("exact copy content mapping", () => {
  it("writes client values slot by slot and deletes slots the client left empty", () => {
    const lines = slotMapping(brief, analysis({ textSlots: ["title", "price", "phone", "cta", "logo"] }));
    expect(lines[0]).toContain('"Formation Excel"');
    expect(lines[1]).toMatch(/Price slot → DELETE/);
    expect(lines[2]).toContain("+228 90 00 00 00");
    expect(lines[3]).toContain("Inscrivez-vous maintenant");
    expect(lines[4]).toMatch(/FLYERMINT/);
  });

  it("keeps client values the reference has no slot for, such as the CTA", () => {
    const ref = analysis({ textSlots: ["title", "price", "phone", "logo"] });
    const prompt = buildPrompt(brief, buildArtDirection(brief), { hasVisualReferenceImage: true, analysis: ref });
    expect(unplacedClientText(brief, ref)).toEqual(['CTA / button: "Inscrivez-vous maintenant"']);
    expect(prompt).toContain('CTA / button: "Inscrivez-vous maintenant"');
    expect(prompt).toContain('Title slot → "Formation Excel"');
  });

  it("detects old reference text still visible on the result", () => {
    const leftovers = findLeftovers(
      ["FORMATION EXCEL", "Centre Bureautique Plus", "Appelez 90112233"],
      ["Centre Bureautique Plus", "Appelez 90112233", "FORMATION"],
      ["Formation Excel", "+228 90 00 00 00"],
    );
    expect(leftovers).toEqual(expect.arrayContaining(["centre", "bureautique", "90112233"]));
    expect(leftovers).not.toContain("formation");
  });

  it("fails QC on leftovers or weak structure, even if the poster looks good", () => {
    const base: PosterQcReport = { ...skippedQcReport(), pass: true, issues: [], visible_text: ["Formation Excel"], structure_score: 5 };
    const weak = applyReferenceCheck(base, { originalText: [], clientText: ["Formation Excel"], strictStructure: true });
    expect(weak.pass).toBe(false);
    expect(weak.issues.join(" ")).toMatch(/STRUCTURE: 5\/10/);
    const ok = applyReferenceCheck({ ...base, structure_score: 9 }, { originalText: [], clientText: ["Formation Excel"], strictStructure: true });
    expect(ok.pass).toBe(true);
  });

  it("final checklist reports unverified text when QC did not run and missing assets that were not sent", () => {
    const checks = finalChecklist({ brief: { ...brief, logoUrl: "data:image/png;base64,L" }, visibleText: undefined, attachmentsSent: ["reference"], referenceRequired: true });
    const byItem = Object.fromEntries(checks.map((check) => [check.item, check.status]));
    expect(byItem).toMatchObject({ TITRE: "not_verified", PRIX: "not_provided", LOGO: "missing", REFERENCE: "ok" });
  });
});

describe("personal reference (packs 20k/25k)", () => {
  it("exact copy with a personal reference edits the client's poster only", () => {
    expect(pickReferenceInputs({ personalUrl: "P", libraryDataUrl: "L", mode: "exact_copy" })).toEqual({ primary: "P", secondary: "", primaryType: "personal" });
  });

  it("composition and inspiration keep the library pick as a secondary hint", () => {
    expect(pickReferenceInputs({ personalUrl: "P", libraryDataUrl: "L", mode: "composition" })).toEqual({ primary: "P", secondary: "L", primaryType: "personal" });
    expect(pickReferenceInputs({ personalUrl: "P", libraryDataUrl: "L", mode: "inspiration" }).secondary).toBe("L");
  });

  it("without uploads the internal reference is used alone; with nothing the generation still has no fake reference", () => {
    expect(pickReferenceInputs({ libraryDataUrl: "L", mode: "exact_copy" })).toEqual({ primary: "L", secondary: "", primaryType: "internal" });
    expect(pickReferenceInputs({ mode: "exact_copy" })).toEqual({ primary: "", secondary: "", primaryType: "none" });
  });

  it("sends personal reference, internal hint, photo and logo as four real images (test 36)", () => {
    const refs = pickReferenceInputs({ personalUrl: "data:image/jpeg;base64,PERSO", libraryDataUrl: "data:image/jpeg;base64,LIB", mode: "composition" });
    const withAssets = { ...brief, referenceMode: "composition", mainImageUrl: "data:image/jpeg;base64,P", logoUrl: "data:image/png;base64,L" } as CreateBriefInput;
    const attachments = collectImageAttachments(withAssets, refs.primary, refs.secondary);
    expect(attachments.map((item) => [item.role, item.url.slice(-5)])).toEqual([
      ["reference", "PERSO"],
      ["reference_secondary", "4,LIB"],
      ["photo", "e64,P"],
      ["logo", "e64,L"],
    ]);
    const checks = finalChecklist({ brief: withAssets, visibleText: undefined, attachmentsSent: attachments.map((a) => a.role), referenceRequired: true });
    expect(checks.filter((c) => ["LOGO", "IMAGE", "REFERENCE"].includes(c.item)).every((c) => c.status === "ok")).toBe(true);
  });

  it("without uploads only the internal reference is sent (test 37)", () => {
    const refs = pickReferenceInputs({ libraryDataUrl: "data:image/jpeg;base64,LIB", mode: "exact_copy" });
    expect(collectImageAttachments(brief, refs.primary, refs.secondary).map((a) => a.role)).toEqual(["reference"]);
  });
});

describe("exact copy request", () => {
  it("uses gemini-3-pro-image and sends reference, photo and logo with their roles", () => {
    expect(EXACT_COPY_MODEL).toBe("google/gemini-3-pro-image");
    const attachments = collectImageAttachments(
      { ...brief, mainImageUrl: "data:image/jpeg;base64,P", logoUrl: "data:image/png;base64,L" },
      "data:image/jpeg;base64,R",
      "data:image/jpeg;base64,S",
    );
    expect(attachments.map((item) => item.role)).toEqual(["reference", "reference_secondary", "photo", "logo"]);
    const body = geminiImageRequestBody(EXACT_COPY_MODEL, "P", attachments, "exact_copy");
    expect(body.model).toBe("google/gemini-3-pro-image");
  });
});
