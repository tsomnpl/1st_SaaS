import { afterEach, describe, expect, it, vi } from "vitest";
import {
  callJobRadarRodiumChat,
  JOBRADAR_RODIUM_DISABLED_CODE,
} from "./ai-service";

const ORIGINAL = process.env.JOBRADAR_RODIUMAI_ENABLED;

afterEach(() => {
  vi.unstubAllGlobals();
  if (ORIGINAL === undefined) {
    delete process.env.JOBRADAR_RODIUMAI_ENABLED;
  } else {
    process.env.JOBRADAR_RODIUMAI_ENABLED = ORIGINAL;
  }
});

describe("JobRadar AIService Rodium block", () => {
  it("refuses to call Rodium while the kill switch is off", async () => {
    delete process.env.JOBRADAR_RODIUMAI_ENABLED;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callJobRadarRodiumChat({
        model: "openai/gpt-4.1-mini",
        messages: [{ role: "user", content: "find internships" }],
      }),
    ).rejects.toThrow(JOBRADAR_RODIUM_DISABLED_CODE);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still blocks explicit false even if a key is present", async () => {
    process.env.JOBRADAR_RODIUMAI_ENABLED = "false";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callJobRadarRodiumChat({
        model: "openai/gpt-4.1-mini",
        messages: [{ role: "user", content: "match this CV" }],
      }),
    ).rejects.toThrow(JOBRADAR_RODIUM_DISABLED_CODE);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
