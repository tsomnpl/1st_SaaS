/**
 * Two variants are limited to the 20 000 and 25 000 FCFA packs.
 * The server checks a completed payment. The browser plan flag is ignored.
 *
 * Mint rule for V1: one "two variants" action consumes TWO_VARIANT_MINT_COST (1) Mint.
 * That single debit must cover two Rodium image calls. It is recorded as one GENERATION
 * ledger row. Variant B has mintCost 0 so the pair is not charged twice.
 *
 * Economics measured on 2026-09-30 from Generation.rodiCost:
 * 8 generations, 7 FAILED, 1 COMPLETED, that success cost 52.391 RODI.
 * Average = minimum = maximum = 52.391 on the only successful row.
 * No RODI-to-FCFA rate exists in the product, so the margin of two calls
 * inside one Mint is not proven. Plan prices are unchanged.
 */
export const TWO_VARIANT_PLAN_CODES = ["PACK_20K", "PACK_25K"] as const;
export const TWO_VARIANT_MINT_COST = 1;
export const OBSERVED_SUCCESSFUL_RODI_COST = 52.391;
export const OBSERVED_VARIANT_SAMPLE = {
  measuredOn: "2026-09-30",
  generations: 8,
  completedWithCost: 1,
  failed: 7,
  average: OBSERVED_SUCCESSFUL_RODI_COST,
  minimum: OBSERVED_SUCCESSFUL_RODI_COST,
  maximum: OBSERVED_SUCCESSFUL_RODI_COST,
  sum: OBSERVED_SUCCESSFUL_RODI_COST,
};

export type VariantLetter = "A" | "B";
export type VariantLayoutMode = "personal" | "exact" | "free";

export function planAllowsTwoVariants(code: string) {
  return (TWO_VARIANT_PLAN_CODES as readonly string[]).includes(code);
}

export function variantLayoutInstruction(variant: VariantLetter, mode: VariantLayoutMode) {
  if (mode === "personal") {
    return variant === "A"
      ? "VARIANT A. Same client facts and the same personal reference. Keep the existing grid, positions and colors. Give a little more weight to the zones already on the left. Do not invent a new composition."
      : "VARIANT B. Same client facts and the same personal reference. Keep the existing grid, positions and colors. Give a little more weight to the zones already on the right. Do not invent a new composition.";
  }
  if (mode === "exact") {
    return variant === "A"
      ? "VARIANT A. Same client facts and the same reference frame. Reading order stays left to right inside the existing blocks. Do not move the photograph to the opposite side and do not invent facts."
      : "VARIANT B. Same client facts and the same reference frame. Reading order runs right to left inside the existing blocks. Do not move the photograph to the opposite side and do not invent facts.";
  }
  return variant === "A"
    ? "VARIANT A. Same client facts. Composition: main subject dominant on the left, commercial content on the right."
    : "VARIANT B. Same client facts. Composition: main subject dominant on the right, commercial content on the left.";
}

export type VariantCostRow = {
  variant: VariantLetter | null;
  status: string;
  rodiCost: number | null;
};

export function summarizeVariantCosts(rows: VariantCostRow[]) {
  const side = (letter: VariantLetter) => rows.filter((row) => row.variant === letter);
  const numbers = (list: VariantCostRow[]) =>
    list.map((row) => row.rodiCost).filter((value): value is number => typeof value === "number");
  const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
  const a = side("A");
  const b = side("B");
  const aCosts = numbers(a);
  const bCosts = numbers(b);
  const all = [...aCosts, ...bCosts];
  return {
    countA: a.length,
    countB: b.length,
    failedA: a.filter((row) => row.status === "FAILED").length,
    failedB: b.filter((row) => row.status === "FAILED").length,
    totalRodi: Number(all.reduce((sum, value) => sum + value, 0).toFixed(3)),
    avgA: average(aCosts) === null ? null : Number(average(aCosts)!.toFixed(3)),
    avgB: average(bCosts) === null ? null : Number(average(bCosts)!.toFixed(3)),
    max: all.length ? Math.max(...all) : null,
  };
}
