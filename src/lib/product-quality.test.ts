import { describe, expect, it } from "vitest";
import {
  DOMAIN_CATALOG_GROUPS,
  loadPrivateStyleReferenceDataUrl,
  normalizeDomainKey,
  selectVisualReferences,
} from "./visual-references";
import { DOMAINS } from "./domains";
import { COOKIE_CONSENT_KEY } from "./cookie-consent";
import { isCriticalQcFailure, parseQcReport, skippedQcReport } from "./quality-control";
import { BRAND } from "./brand";

describe("visual reference library", () => {
  it("maps every FlyerMint domain onto the references.pdf catalogue groups", () => {
    for (const domain of DOMAINS) {
      expect(DOMAIN_CATALOG_GROUPS[domain]?.length).toBeGreaterThan(0);
    }
  });

  it("selects catalog sheets for a domain instead of copying a poster", () => {
    const result = selectVisualReferences({
      domain: "Restauration",
      visualType: "Menu",
      objective: "Faire commander ce soir",
    });
    expect(result.usedVisualLibrary).toBe(true);
    expect(result.selected.length).toBeGreaterThan(0);
    expect(result.principles.join(" ")).toMatch(/Never copy/i);
    expect(normalizeDomainKey(result.selected[0].domaine)).toContain("restauration");
  });

  it("refuses to load a style bitmap outside the private store", () => {
    expect(loadPrivateStyleReferenceDataUrl("../package.json")).toBe("");
    expect(loadPrivateStyleReferenceDataUrl("/etc/passwd")).toBe("");
    expect(loadPrivateStyleReferenceDataUrl("public/creations/restauration-01.webp")).toBe("");
    expect(loadPrivateStyleReferenceDataUrl("storage/private/../package.json")).toBe("");
  });
});

describe("cookie consent key", () => {
  it("uses a stable local storage key", () => {
    expect(COOKIE_CONSENT_KEY).toBe("fm-cookie-consent");
  });
});

describe("quality gate", () => {
  it("does not treat a skipped vision check as a critical refund", () => {
    expect(isCriticalQcFailure(skippedQcReport())).toBe(false);
  });

  it("treats missing humans as a critical failure", () => {
    const report = parseQcReport(
      JSON.stringify({
        pass: false,
        has_person: false,
        person_natural: false,
        readable_text: true,
        text_matches_brief: true,
        domain_fit: true,
        looks_ai_generic: false,
        format_ok: true,
        issues: ["no human"],
      }),
    );
    expect(isCriticalQcFailure(report)).toBe(true);
  });

  it("rejects a generic AI poster even if a person is present", () => {
    const report = parseQcReport(
      JSON.stringify({
        pass: false,
        has_person: true,
        person_natural: true,
        readable_text: true,
        text_matches_brief: true,
        domain_fit: true,
        looks_ai_generic: true,
        format_ok: true,
        composition_match: false,
        margins_ok: true,
        issues: ["generic AI"],
      }),
    );
    expect(isCriticalQcFailure(report)).toBe(true);
  });

  it("fails closed when design laws or reference match fail", () => {
    const report = parseQcReport(
      JSON.stringify({
        pass: true,
        has_person: true,
        person_natural: true,
        readable_text: true,
        text_matches_brief: true,
        domain_fit: true,
        looks_ai_generic: false,
        format_ok: true,
        composition_match: true,
        margins_ok: true,
        design_rules: false,
        hierarchy: false,
        contrast: true,
        alignment: true,
        issues: ["weak hierarchy"],
      }),
    );
    expect(report.pass).toBe(false);
    expect(isCriticalQcFailure(report)).toBe(true);
  });
});

describe("brand palette", () => {
  it("keeps mint as an accent on night and white", () => {
    expect(BRAND.colors.night).toBe("#111827");
    expect(BRAND.colors.mint).toBe("#20C997");
    expect(BRAND.colors.mintWash).toBe("#DFFAF0");
    expect(BRAND.colors.white).toBe("#FFFFFF");
  });
});
