import { describe, expect, it } from "vitest";
import { exactCopySlots, isExactCopy } from "@/lib/exact-copy";
import { askGapSentence, briefFromAsk, readAsk } from "@/lib/ask-brief";

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

  it("refuses a wedding ask that only states a theme and colors", () => {
    const ask = 'je veux une affiche pour annoncer mon mariage sur le thème "Akatsuti", je veux des couleurs rouge et noir';
    const reading = readAsk(ask);

    expect(briefFromAsk(ask)).toBeNull();
    expect(reading.status).toBe("incomplete");
    if (reading.status !== "incomplete") return;
    expect(reading.missing).toContain("date");
    expect(reading.missing).toContain("names");
    expect(reading.missing.join(" ")).not.toContain("je veux");
    expect(
      askGapSentence(
        reading.missing,
        {
          date: "la date",
          names: "les noms des mariés",
          who: "le prénom",
          price: "le prix",
          poste: "le poste",
          title: "le texte à écrire sur l’affiche",
        },
        "Je ne compose pas l’affiche. Il manque",
        "et",
      ),
    ).toBe("Je ne compose pas l’affiche. Il manque la date et les noms des mariés.");
  });

  it("keeps a complete wedding ask as poster facts, not as the request", () => {
    const brief = briefFromAsk(
      'je veux une affiche pour annoncer le mariage d\'Ama et Kofi le samedi 12 octobre à Lomé sur le thème "Akatsuti", couleurs rouge et noir',
    );

    expect(brief?.title).toBe("Mariage de Ama et Kofi");
    expect(brief?.title.toLowerCase()).not.toMatch(/je veux|couleurs|thème/);
    expect(brief?.subtitle).toBe("Akatsuti");
    expect(brief?.date?.toLowerCase()).toContain("octobre");
    expect(brief?.location?.toLowerCase()).toContain("lom");
    expect(brief?.colors).toEqual(["rouge", "noir"]);
  });

  it("refuses a menu ask that has no price", () => {
    const reading = readAsk("Story menu burger à Cotonou");
    expect(reading.status).toBe("incomplete");
    if (reading.status !== "incomplete") return;
    expect(reading.missing).toContain("price");
  });
});
