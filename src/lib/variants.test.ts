import { describe, expect, it } from "vitest";
import {
  OBSERVED_VARIANT_SAMPLE,
  TWO_VARIANT_MINT_COST,
  TWO_VARIANT_PLAN_CODES,
  planAllowsTwoVariants,
  summarizeVariantCosts,
  variantLayoutInstruction,
} from "./variants";

describe("two variants", () => {
  it("allows only the 20 000 and 25 000 FCFA packs and charges one Mint", () => {
    expect([...TWO_VARIANT_PLAN_CODES]).toEqual(["PACK_20K", "PACK_25K"]);
    expect(TWO_VARIANT_MINT_COST).toBe(1);
    expect(planAllowsTwoVariants("PACK_20K")).toBe(true);
    expect(planAllowsTwoVariants("PACK_25K")).toBe(true);
    expect(planAllowsTwoVariants("PACK_15K")).toBe(false);
    expect(planAllowsTwoVariants("FREE")).toBe(false);
  });

  it("asks for two compositions and keeps a personal reference inside its frame", () => {
    const left = variantLayoutInstruction("A", "free");
    const right = variantLayoutInstruction("B", "free");
    expect(left).not.toBe(right);
    expect(left).toMatch(/left/i);
    expect(right).toMatch(/right/i);
    const personalA = variantLayoutInstruction("A", "personal");
    const personalB = variantLayoutInstruction("B", "personal");
    expect(personalA).not.toBe(personalB);
    expect(personalA).toMatch(/Do not invent a new composition/);
    expect(personalB).toMatch(/same personal reference/i);
    expect(variantLayoutInstruction("A", "exact")).not.toBe(variantLayoutInstruction("B", "exact"));
  });

  it("keeps the measured Rodium sample visible and summarizes A and B apart", () => {
    expect(OBSERVED_VARIANT_SAMPLE.completedWithCost).toBe(1);
    expect(OBSERVED_VARIANT_SAMPLE.maximum).toBe(52.391);
    const report = summarizeVariantCosts([
      { variant: "A", status: "COMPLETED", rodiCost: 6 },
      { variant: "B", status: "COMPLETED", rodiCost: 7 },
      { variant: "A", status: "FAILED", rodiCost: null },
      { variant: "B", status: "FAILED", rodiCost: 4 },
    ]);
    expect(report).toMatchObject({
      countA: 2,
      countB: 2,
      failedA: 1,
      failedB: 1,
      totalRodi: 17,
      avgA: 6,
      avgB: 5.5,
      max: 7,
    });
  });
});
