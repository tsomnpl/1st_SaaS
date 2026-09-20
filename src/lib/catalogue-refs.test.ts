import { describe, expect, it } from "vitest";
import { catalogueStyleNotesFor } from "./catalogue-refs";

describe("catalogue style notes", () => {
  it("returns domain notes without real brand names", () => {
    const notes = catalogueStyleNotesFor("Evenementiel", 2);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.join("\n")).toMatch(/catalogue evenementiel-/);
    expect(notes.join("\n")).not.toMatch(/fulixgold|zara|nexora|godfactor/i);
  });
});
