import { describe, expect, it } from "vitest";
import type { CreateBriefInput } from "@/lib/flyermint";
import {
  collectImageAttachments,
  geminiImageRequestBody,
  isLikelyImageModel,
  selectImageModel,
  sizeForFormat,
} from "@/server/rodium";
import { supabaseDomainFor } from "@/lib/inspiration-domains";
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
    expect(
      selectImageModel(
        brief,
        "restaurant poster",
        ["openai/gpt-image-2", "google/gemini-3.1-flash-lite-image", "google/gemini-3-pro-image"],
        { hasStyleReference: true },
      ),
    ).toBe("google/gemini-3-pro-image");
    expect(() =>
      selectImageModel(brief, "restaurant poster", ["openai/gpt-image-2"], { hasStyleReference: true }),
    ).toThrow("RODIUM_NO_IMAGE_EDIT_MODEL");
  });

  it("sends the reference poster, the client photo and the client logo as real images", () => {
    const brief = {
      visualType: "Affiche",
      domain: "Technologie",
      objective: "Vendre",
      targetAudience: "Etudiants",
      title: "Google AI Plus",
      format: "affiche_a4",
      creativeFreedom: "liberte_guidee",
      colors: [],
      adaptiveData: {},
      mainImageUrl: "data:image/jpeg;base64,PHOTO",
      logoUrl: "data:image/png;base64,LOGO",
    } as unknown as CreateBriefInput;
    const attachments = collectImageAttachments(brief, "data:image/jpeg;base64,REF");
    expect(attachments.map((item) => item.role)).toEqual(["reference", "photo", "logo"]);
    const body = geminiImageRequestBody("google/gemini-3-pro-image", "PROMPT", attachments);
    const parts = body.messages[0].content as Array<{ type: string; text?: string; image_url?: { url: string } }>;
    expect(parts.filter((part) => part.type === "image_url").map((part) => part.image_url?.url)).toEqual([
      "data:image/jpeg;base64,REF",
      "data:image/jpeg;base64,PHOTO",
      "data:image/png;base64,LOGO",
    ]);
    expect(parts[1].text).toMatch(/REFERENCE POSTER/);
    expect(parts[3].text).toMatch(/CLIENT PHOTO/);
    expect(parts[5].text).toMatch(/CLIENT LOGO/);
  });

  it("searches only the folder of the domain chosen by the client", () => {
    expect(supabaseDomainFor("Education & Formation")).toBe("education");
    expect(supabaseDomainFor("Evenementiel")).toBe("evenementiel");
    expect(supabaseDomainFor("Domaine inconnu")).toBe("");
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
