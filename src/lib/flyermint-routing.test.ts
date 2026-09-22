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
    expect(sizeForFormat("whatsapp_status")).toBe("1024x1536");
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
      ["openai/gpt-5", "openai/gpt-image-2", "google/gemini-3.1-flash-lite-image"],
    );
    expect(model).toBe("google/gemini-3.1-flash-lite-image");
  });

  it("routes a style-reference job to an image-edit model", () => {
    const brief = {
      visualType: "Affiche",
      domain: "Restauration",
      objective: "Faire commander",
      targetAudience: "Public",
      title: "Menu",
      format: "affiche",
      creativeFreedom: "liberte_guidee",
      colors: [],
      adaptiveData: {},
    } as unknown as CreateBriefInput;
    expect(
      selectImageModel(brief, "restaurant poster", ["openai/gpt-image-2", "google/gemini-3.1-flash-image"], {
        hasStyleReference: true,
      }),
    ).toBe("google/gemini-3.1-flash-image");
    expect(() =>
      selectImageModel(brief, "restaurant poster", ["openai/gpt-image-2"], { hasStyleReference: true }),
    ).toThrow("RODIUM_NO_IMAGE_EDIT_MODEL");
  });
});

describe("payments", () => {
  it("classifies money fusion statuses", () => {
    expect(classifyPaymentStatus("paid")).toBe("COMPLETED");
    expect(classifyPaymentStatus("no paid")).toBe("PENDING");
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
