import { describe, expect, it } from "vitest";
import { DOMAINS } from "./domains";
import { allDomainsHaveHumanStaging, humanStagingFor } from "./human-staging";
import { applyRepair, parseQcReport, shouldRepair, skippedQcReport } from "./quality-control";

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

  it("repairs a skipped check instead of shipping it", () => {
    expect(shouldRepair(skippedQcReport())).toBe(true);
    expect(shouldRepair(parseQcReport("not json"))).toBe(true);
  });
});
