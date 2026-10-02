import { describe, expect, it } from "vitest";
import { askTextOf, askUnderstandPrompt, briefFromModelJson, grounded, mergeAskAssets } from "@/lib/ask-understand";
import { copy } from "@/lib/i18n";

const wedding =
  'je veux une affiche pour annoncer mon mariage sur le thème "Akatsuti", je veux des couleurs rouge et noir';

describe("understood ask", () => {
  it("no longer tells the person that Mint will fill the form", () => {
    expect(copy.fr.form.askLead.toLowerCase()).not.toContain("formulaire");
    expect(copy.fr.form.askPlaced.toLowerCase()).not.toContain("formulaire");
    expect(copy.fr.form.askFilled.toLowerCase()).not.toContain("formulaire");
    expect(copy.en.form.askLead.toLowerCase()).not.toContain("form");
    expect(copy.fr.form.askLead).toContain("copie exacte");
  });

  it("reads the ask field without treating a form brief as an ask", () => {
    expect(askTextOf({ ask: "  menu burger  " })).toBe("menu burger");
    expect(askTextOf({ ask: " " })).toBe("");
    expect(askTextOf({ visualType: "Menu", title: "Burger" })).toBeNull();
    expect(askTextOf(null)).toBeNull();
  });

  it("tells the model to understand the request and leave optional facts empty", () => {
    const prompt = askUnderstandPrompt("affiche rose");
    expect(prompt).toContain("copie_exacte");
    expect(prompt).toContain("N'invente aucune date");
    expect(prompt).toContain("optionnels");
    expect(prompt).toContain("Sante & Clinique");
    expect(prompt).toContain("affiche rose");
  });

  it("drops dates, prices, names and phones the person did not write", () => {
    const brief = briefFromModelJson(
      JSON.stringify({
        visualType: "Affiche événement",
        domain: "Mariage",
        objective: "Annoncer un mariage sur le thème Akatsuti",
        targetAudience: "Invités du village",
        title: "Mariage",
        subtitle: "Akatsuti",
        description: "Une cérémonie inoubliable au palais",
        price: "5000 FCFA",
        date: "samedi 12 octobre",
        time: "19h",
        location: "Lomé",
        contactPhone: "90 12 34 56",
        cta: "Réserve",
        format: "instagram_post",
        creativeFreedom: "liberte_totale",
        colors: ["rouge", "noir", "or"],
        adaptiveData: { noms: "Ama et Kofi", theme: "Akatsuti" },
      }),
      wedding,
    );

    expect(brief?.creativeFreedom).toBe("copie_exacte");
    expect(brief?.domain).toBe("Mariage");
    expect(brief?.title.toLowerCase()).toBe("mariage");
    expect(brief?.subtitle).toBe("Akatsuti");
    expect(brief?.colors).toEqual(["rouge", "noir"]);
    expect(brief?.date ?? "").toBe("");
    expect(brief?.price ?? "").toBe("");
    expect(brief?.time ?? "").toBe("");
    expect(brief?.location ?? "").toBe("");
    expect(brief?.contactPhone ?? "").toBe("");
    expect(brief?.description ?? "").toBe("");
    expect(brief?.cta ?? "").toBe("");
    expect(brief?.adaptiveData.noms ?? "").toBe("");
    expect(brief?.adaptiveData.theme).toBe("Akatsuti");
    expect(brief?.targetAudience).toBe("Public visé");
  });

  it("keeps a date, a price and names when they are in the request", () => {
    const source =
      'mariage d\'Ama et Kofi le samedi 12 octobre à Lomé, entrée 2000 FCFA, appelle 90 12 34 56, thème "Akatsuti"';
    const brief = briefFromModelJson(
      "```json\n" +
        JSON.stringify({
          visualType: "Affiche événement",
          domain: "Mariage",
          objective: "Annoncer le mariage d'Ama et Kofi",
          targetAudience: "Invités",
          title: "Mariage de Ama et Kofi",
          subtitle: "Akatsuti",
          date: "samedi 12 octobre",
          price: "2000 FCFA",
          location: "Lomé",
          contactPhone: "90 12 34 56",
          cta: "Appelle",
          format: "instagram_post",
          colors: ["rouge"],
          adaptiveData: { noms: "Ama et Kofi" },
        }) +
        "\n```",
      source,
    );

    expect(brief?.title).toBe("Mariage de Ama et Kofi");
    expect(brief?.date?.toLowerCase()).toContain("octobre");
    expect(brief?.price).toMatch(/2000/);
    expect(brief?.location?.toLowerCase()).toContain("lom");
    expect(brief?.contactPhone).toBe("90 12 34 56");
    expect(brief?.adaptiveData.noms).toBe("Ama et Kofi");
    expect(brief?.market).toBe("TG");
  });

  it("keeps cancer posters on the health sources even if the model picks an event", () => {
    const brief = briefFromModelJson(
      JSON.stringify({
        visualType: "Affiche promotionnelle",
        domain: "Evenementiel",
        objective: "Sensibiliser",
        title: "La Montée Contre le Cancer",
        subtitle: "Octobre Rose",
        format: "instagram_story",
        colors: ["rose"],
      }),
      "La Montée Contre le Cancer, Octobre Rose, couleurs rose",
    );

    expect(brief?.domain).toBe("Sante & Clinique");
    expect(brief?.visualType).toBe("Affiche événement");
    expect(brief?.subtitle).toBe("Octobre Rose");
    expect(brief?.format).toBe("instagram_post");
  });

  it("accepts a real model answer and ignores a format the person did not ask for", () => {
    const brief = briefFromModelJson(
      `\`\`\`json
{
  "visualType": "Save the date",
  "domain": "Mariage",
  "objective": "Annoncer un mariage sur le thème Akatsuti",
  "targetAudience": "",
  "title": "Mariage",
  "subtitle": "Thème Akatsuti",
  "description": "",
  "price": "",
  "date": "",
  "time": "",
  "location": "",
  "contactPhone": "",
  "whatsapp": "",
  "cta": "",
  "format": "affiche_a4",
  "colors": ["rouge", "noir"],
  "style": "Akatsuti",
  "mood": "",
  "market": "",
  "adaptiveData": {},
  "creativeFreedom": "copie_exacte"
}
\`\`\``,
      wedding,
    );

    expect(brief?.visualType).toBe("Save the date");
    expect(brief?.title).toBe("Mariage");
    expect(brief?.subtitle?.toLowerCase()).toContain("akatsuti");
    expect(brief?.colors).toEqual(["rouge", "noir"]);
    expect(brief?.date ?? "").toBe("");
    expect(brief?.format).toBe("instagram_post");
    expect(brief?.creativeFreedom).toBe("copie_exacte");
  });

  it("returns nothing when the model answer is not a brief", () => {
    expect(briefFromModelJson("je ne sais pas", "affiche mariage")).toBeNull();
    expect(grounded("menu burger", "pizza")).toBe(false);
  });

  it("keeps the attached photo on the understood brief", () => {
    const brief = briefFromModelJson(
      JSON.stringify({
        domain: "Mode & Accessoires",
        visualType: "Affiche promotionnelle",
        title: "Robes",
        objective: "Vendre des robes",
        format: "instagram_post",
      }),
      "vendre mes robes",
    );
    const merged = mergeAskAssets(brief!, {
      ask: "vendre mes robes",
      mainImageUrl: "https://example.com/photo.jpg",
      rememberBrand: false,
    });
    expect(merged.mainImageUrl).toBe("https://example.com/photo.jpg");
    expect(merged.rememberBrand).toBe(false);
    expect(merged.creativeFreedom).toBe("copie_exacte");
    expect(merged.seasonalDecline).toBe(true);
  });
});
