import { describe, expect, it } from "vitest";
import type { CreateBriefInput } from "@/lib/flyermint";
import { isLikelyImageModel, selectImageModel, sizeForFormat } from "@/server/rodium";
import { classifyPaymentStatus } from "@/server/payments";
import { paidPlans } from "@/lib/plans";

describe("image model routing", () => {
  it("rejects text-only models", () => {
    expect(isLikelyImageModel("openai/gpt-5")).toBe(false);
    expect(isLikelyImageModel("openai/whisper-1")).toBe(false);
    expect(isLikelyImageModel("google/gemini-3-pro-image")).toBe(true);
    expect(isLikelyImageModel("openai/gpt-image-2")).toBe(true);
  });

  it("uses official Rodium image sizes only", () => {
    expect(sizeForFormat("affiche")).toBe("1024x1536");
    expect(sizeForFormat("instagram_story")).toBe("1024x1536");
    expect(sizeForFormat("instagram_post")).toBe("1024x1024");
  });

  it("never falls back to a text model", () => {
    const model = selectImageModel(
      {
        visualType: "Affiche",
        domain: "Evenementiel",
        objective: "Attirer",
        targetAudience: "Public",
        title: "Live",
        format: "instagram_post",
        creativeFreedom: "liberte_guidee",
        colors: [],
        adaptiveData: {},
      } as unknown as CreateBriefInput,
      "concert premium",
      ["openai/gpt-5", "openai/gpt-image-1", "google/gemini-3.1-flash-image"],
    );
    expect(model).toBe("openai/gpt-image-1");
  });
});

describe("payments", () => {
  it("classifies money fusion statuses", () => {
    expect(classifyPaymentStatus("paid")).toBe("COMPLETED");
    expect(classifyPaymentStatus("cancelled")).toBe("CANCELLED");
    expect(classifyPaymentStatus("failed")).toBe("FAILED");
    expect(classifyPaymentStatus("pending")).toBe("PENDING");
  });
});

describe("plans", () => {
  it("keeps official mint packs", () => {
    const packs = paidPlans();
    expect(packs).toHaveLength(6);
    expect(packs.map((p) => [p.priceFcfa, p.mintAmount])).toEqual([
      [2000, 2],
      [5000, 2],
      [10000, 5],
      [15000, 10],
      [20000, 15],
      [25000, 20],
    ]);
  });
});
