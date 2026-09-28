import { describe, expect, it } from "vitest";
import { COVER_MINT, COVER_NAVY, contrastRatio } from "./contrast";

describe("cover contrast", () => {
  it("keeps navy text on mint above 5.7 to 1", () => {
    const ratio = contrastRatio(COVER_NAVY, COVER_MINT);
    expect(ratio).toBeGreaterThan(5.7);
    expect(ratio).toBeLessThan(6);
  });
});
