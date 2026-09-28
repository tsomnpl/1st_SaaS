import { describe, expect, it } from "vitest";
import type { CreateBriefInput } from "@/lib/flyermint";
import { isLikelyImageModel, selectImageModel, sizeForFormat } from "@/server/rodium";
import { classifyPaymentStatus } from "@/server/payments";
import { isLaunchOfferOpen, launchOfferEndsAt, paidPlans, readLaunchAt, visiblePaidPlans } from "@/lib/plans";

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
      ["openai/gpt-5", "openai/gpt-image-2", "google/gemini-3.1-flash-image"],
    );
    expect(model).toBe("openai/gpt-image-2");
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
    expect(paidPlans().find((plan) => plan.code === "STARTER_2K")?.durationDays).toBeNull();
  });

  it("keeps the 2 000 FCFA offer until 30 days after the real launch", () => {
    expect(readLaunchAt("")).toBeNull();
    expect(readLaunchAt("pas une date")).toBeNull();
    expect(isLaunchOfferOpen(new Date("2026-10-15T00:00:00Z"), null)).toBe(true);
    const launch = new Date("2026-10-01T00:00:00Z");
    const ends = launchOfferEndsAt(launch);
    expect(ends?.toISOString()).toBe("2026-10-31T00:00:00.000Z");
    expect(isLaunchOfferOpen(new Date("2026-10-30T23:00:00Z"), launch)).toBe(true);
    expect(isLaunchOfferOpen(new Date("2026-10-31T00:00:00Z"), launch)).toBe(false);
    expect(visiblePaidPlans(new Date("2026-11-02T00:00:00Z"), launch).some((plan) => plan.code === "STARTER_2K")).toBe(false);
    expect(visiblePaidPlans(new Date("2026-10-02T00:00:00Z"), launch).some((plan) => plan.code === "STARTER_2K")).toBe(true);
  });
});
