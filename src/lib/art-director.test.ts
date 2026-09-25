import { describe, expect, it } from "vitest";
import { DOMAINS } from "./domains";
import { allDomainsHaveHumanStaging, humanStagingFor } from "./human-staging";
import {
  applyRepair,
  applyTextCheck,
  findTypos,
  isCriticalQcFailure,
  parseQcReport,
  qcWasSkipped,
  shouldRepair,
  skippedQcReport,
} from "./quality-control";

describe("art director human staging", () => {
  it("defines a human role for every domain", () => {
    expect(allDomainsHaveHumanStaging()).toBe(true);
    for (const domain of DOMAINS) {
      const staging = humanStagingFor(domain);
      expect(staging.role).toMatch(/[a-z]/i);
      expect(staging.action).toMatch(/[a-z]/i);
    }
  });
});

describe("poster quality control", () => {
  it("fails a poster with no person", () => {
    const report = parseQcReport(
      JSON.stringify({
        pass: false,
        has_person: false,
        person_natural: false,
        readable_text: true,
        text_matches_brief: true,
        domain_fit: true,
        looks_ai_generic: true,
        issues: ["no human"],
        repair_prompt: "Add one natural photographed person using the product.",
      }),
    );
    expect(shouldRepair(report)).toBe(true);
    expect(applyRepair("base prompt", report)).toMatch(/QUALITY REPAIR/);
  });

  it("marks a missing QC report as skipped", () => {
    expect(qcWasSkipped(skippedQcReport())).toBe(true);
    expect(qcWasSkipped(parseQcReport("not json"))).toBe(true);
  });

  it("catches the 'artister' typo from the FORMATION poster", () => {
    const allowed = ["Formation", "Place limité", "Réduction de 50% 3 premiers", "12 décembre", "Gazo", "Artistes / invitée", "Heure d’ouverture", "Réserve mtn"];
    expect(findTypos(["FORMATION", "Place limité", "artister: Gazo", "Réserve mtn"], allowed)).toEqual([
      { found: "artister", expected: "artistes" },
    ]);
    expect(findTypos(["FORMATION", "Place limité", "Gazo"], allowed)).toEqual([]);
    const report = applyTextCheck(
      parseQcReport(JSON.stringify({ pass: true, visible_text: ["FORMATION", "artister: Gazo"] })),
      allowed,
    );
    expect(report.pass).toBe(false);
    expect(report.text_matches_brief).toBe(false);
    expect(report.issues.join(" ")).toContain('"artister" au lieu de "artistes"');
    expect(isCriticalQcFailure(report)).toBe(true);
    expect(applyRepair("base", report, { referenceCopy: true })).toMatch(/misspelled words \(artister\)/);
  });
});
