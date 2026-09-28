import { describe, expect, it } from "vitest";
import { DOMAINS } from "@/lib/domains";
import { DESIGN_LAWS } from "@/lib/inspiration";
import { buildArtDirection, buildPrompt, createBriefSchema } from "@/lib/flyermint";
import { SHOWCASE_SHEETS } from "@/lib/showcase-sheets";
import { buildShowcasePrompt } from "@/lib/showcase-design";

function expectAllLaws(prompt: string, label: string) {
  expect(DESIGN_LAWS).toHaveLength(10);
  for (const [index, law] of DESIGN_LAWS.entries()) {
    expect(prompt, `${label} missing law ${index + 1}`).toContain(`${index + 1}. ${law}`);
  }
}

describe("design laws on every poster", () => {
  it("keeps exactly ten laws", () => {
    expect(DESIGN_LAWS).toHaveLength(10);
  });

  it("puts all ten laws in every product generation prompt", () => {
    for (const domain of DOMAINS) {
      const brief = createBriefSchema.parse({
        visualType: "Affiche",
        domain,
        objective: "Publier une offre",
        targetAudience: "Clients locaux",
        title: "Offre du jour",
        format: "affiche_a4",
        creativeFreedom: "liberte_guidee",
        colors: [],
        adaptiveData: {},
      });
      const prompt = buildPrompt(brief, buildArtDirection(brief));
      expectAllLaws(prompt, domain);
    }
  });

  it("puts all ten laws in every showcase generation prompt", () => {
    for (const sheet of SHOWCASE_SHEETS) {
      expectAllLaws(buildShowcasePrompt(sheet, false), sheet.id);
      expectAllLaws(buildShowcasePrompt(sheet, true), `${sheet.id} with reference`);
    }
  });
});
