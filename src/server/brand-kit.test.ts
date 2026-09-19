import { describe, expect, it } from "vitest";
import { isMissingBrandKitRelation } from "./brand-kit";

describe("brand kit resilience", () => {
  it("detects a missing BrandKit table as safe to ignore", () => {
    expect(
      isMissingBrandKitRelation({
        code: "P2021",
        message: "The table `public.BrandKit` does not exist in the current database.",
      }),
    ).toBe(true);
    expect(
      isMissingBrandKitRelation(
        new Error('relation "BrandKit" does not exist'),
      ),
    ).toBe(true);
  });

  it("does not swallow unrelated database errors", () => {
    expect(isMissingBrandKitRelation(new Error("UNAUTHORIZED"))).toBe(false);
    expect(isMissingBrandKitRelation({ code: "P2002", message: "Unique constraint" })).toBe(false);
  });
});
