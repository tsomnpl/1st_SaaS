import { describe, expect, it } from "vitest";
import {
  DOMAIN_CATALOG_GROUPS,
  loadPrivateStyleReferenceDataUrl,
  normalizeDomainKey,
  selectVisualReferences,
} from "./visual-references";
import { DOMAINS } from "./domains";
import { extractPaymentToken } from "@/server/payments";
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

describe("payment token extraction", () => {
  it("reads nested Money Fusion tokens", () => {
    expect(extractPaymentToken({ data: { token: "abc" } })).toBe("abc");
    expect(extractPaymentToken({ tokenPay: "xyz" })).toBe("xyz");
    expect(extractPaymentToken({})).toBe("");
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
});

describe("brand palette", () => {
  it("keeps mint as an accent on night and white", () => {
    expect(BRAND.colors.night).toBe("#111827");
    expect(BRAND.colors.mint).toBe("#20C997");
    expect(BRAND.colors.mintWash).toBe("#DFFAF0");
    expect(BRAND.colors.white).toBe("#FFFFFF");
  });
});
