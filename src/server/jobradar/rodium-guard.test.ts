import { afterEach, describe, expect, it } from "vitest";
import {
  assertJobRadarRodiumEnabled,
  isJobRadarRodiumEnabled,
  JOBRADAR_RODIUM_DISABLED_CODE,
} from "./rodium-guard";

const ORIGINAL = process.env.JOBRADAR_RODIUMAI_ENABLED;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.JOBRADAR_RODIUMAI_ENABLED;
  } else {
    process.env.JOBRADAR_RODIUMAI_ENABLED = ORIGINAL;
  }
});

describe("JobRadar Rodium kill switch", () => {
  it("is disabled when the flag is missing", () => {
    delete process.env.JOBRADAR_RODIUMAI_ENABLED;
    expect(isJobRadarRodiumEnabled()).toBe(false);
    expect(() => assertJobRadarRodiumEnabled()).toThrow(
      JOBRADAR_RODIUM_DISABLED_CODE,
    );
  });

  it("is disabled for false / empty / random values", () => {
    for (const value of ["false", "FALSE", "0", "off", "", "yes"]) {
      expect(isJobRadarRodiumEnabled(value)).toBe(false);
    }
  });

  it("unlocks only for true or 1", () => {
    expect(isJobRadarRodiumEnabled("true")).toBe(true);
    expect(isJobRadarRodiumEnabled("TRUE")).toBe(true);
    expect(isJobRadarRodiumEnabled("1")).toBe(true);
  });
});
