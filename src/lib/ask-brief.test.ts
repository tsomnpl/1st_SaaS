import { describe, expect, it } from "vitest";
import { exactCopySlots, isExactCopy } from "@/lib/exact-copy";
import { briefFromAsk } from "@/lib/ask-brief";

describe("brief from a direct ask", () => {
  it("turns a sentence into the exact-copy brief", () => {
    const brief = briefFromAsk(
      "Affiche anniversaire de Awa samedi 4 octobre à Lomé, 19h, entrée 2000 FCFA, appelle 90 12 34 56",
    );

    expect(brief).not.toBeNull();
    expect(isExactCopy(brief!)).toBe(true);
    expect(brief?.domain).toBe("Anniversaire");
    expect(brief?.visualType).toBe("Affiche événement");
    expect(brief?.title).toBe("Anniversaire de Awa");
    expect(brief?.price).toMatch(/2000/);
    expect(brief?.time).toBe("19h");
    expect(brief?.date?.toLowerCase()).toContain("octobre");
    expect(brief?.location?.toLowerCase()).toContain("lom");
    expect(brief?.contactPhone).toBe("90 12 34 56");
    expect(brief?.cta).toBe("Appelle");
    expect(brief?.market).toBe("TG");
    expect(brief?.format).toBe("instagram_post");

    const slots = exactCopySlots(brief!).provided.map((slot) => slot.value.toLowerCase());
    expect(slots.some((value) => value.includes("awa"))).toBe(true);
    expect(slots.some((value) => value.includes("2000"))).toBe(true);
    expect(slots.join(" ")).not.toContain("appelle 90");
  });

  it("keeps a restaurant ask on the restaurant reference and a story format", () => {
    const brief = briefFromAsk("Story menu burger 3500 FCFA à Cotonou");

    expect(brief?.domain).toBe("Restauration");
    expect(brief?.visualType).toBe("Menu");
    expect(brief?.format).toBe("instagram_story");
    expect(brief?.price).toMatch(/3500/);
    expect(brief?.location?.toLowerCase()).toContain("cotonou");
    expect(brief?.market).toBe("BJ");
    expect(brief?.creativeFreedom).toBe("copie_exacte");
  });

  it("reads a clothing promo without turning WhatsApp into a status format", () => {
    const brief = briefFromAsk("Promo robes 15000 FCFA pour les femmes, whatsapp 97 00 11 22");

    expect(brief?.domain).toBe("Mode & Accessoires");
    expect(brief?.visualType).toBe("Affiche promotionnelle");
    expect(brief?.format).toBe("instagram_post");
    expect(brief?.title).toBe("Promo robes");
    expect(brief?.targetAudience).toBe("femmes");
    expect(brief?.whatsapp).toBe("97 00 11 22");
    expect(brief?.cta).toBe("WhatsApp");
  });

  it("returns nothing when the ask is empty", () => {
    expect(briefFromAsk("  ")).toBeNull();
  });
});
