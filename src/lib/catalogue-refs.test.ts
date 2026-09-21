import { describe, expect, it } from "vitest";
import {
  catalogueStyleNotesFor,
  createPathForDomaine,
  domainKeyForCatalogueDomaine,
} from "./catalogue-refs";

describe("catalogue style notes", () => {
  it("returns domain notes without real brand names", () => {
    const notes = catalogueStyleNotesFor("Evenementiel", 2);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.join("\n")).toMatch(/catalogue evenementiel-/);
    expect(notes.join("\n")).not.toMatch(/fulixgold|zara|nexora|godfactor/i);
  });

  it("maps catalogue domaines to /create query params", () => {
    expect(domainKeyForCatalogueDomaine("Événementiel")).toBe("Evenementiel");
    expect(domainKeyForCatalogueDomaine("Beauté & Soins")).toBe("Beaute & Soins");
    expect(domainKeyForCatalogueDomaine("Immobilier & Business")).toBe("Immobilier");
    expect(createPathForDomaine("Restauration")).toBe("/create?domain=Restauration");
    expect(createPathForDomaine("Technologie & Éducation")).toBe(
      "/create?domain=Technologie",
    );
  });
});
