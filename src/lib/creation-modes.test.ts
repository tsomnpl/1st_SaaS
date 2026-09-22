import { describe, expect, it } from "vitest";
import {
  CREATION_MODES,
  CREATION_MODE_IDS,
  creationModeById,
  isCreationModeId,
  modeIsPremium,
  modeRequiresPersonalReference,
} from "./creation-modes";

describe("creation modes", () => {
  it("exposes exactly 7 modes and keeps mode 7 premium", () => {
    expect(CREATION_MODE_IDS).toHaveLength(7);
    expect(CREATION_MODES).toHaveLength(7);
    expect(CREATION_MODES.map((mode) => mode.id)).toEqual([...CREATION_MODE_IDS]);
    expect(CREATION_MODES.filter((mode) => mode.premium)).toEqual([
      expect.objectContaining({ id: "reference_reproduction", number: 7 }),
    ]);
    expect(modeIsPremium("idea")).toBe(false);
    expect(modeRequiresPersonalReference("reference_reproduction")).toBe(true);
    expect(modeRequiresPersonalReference("product")).toBe(false);
    expect(isCreationModeId("photo")).toBe(true);
    expect(isCreationModeId("unknown")).toBe(false);
    expect(creationModeById("brand")?.title).toMatch(/identité/i);
  });
});
