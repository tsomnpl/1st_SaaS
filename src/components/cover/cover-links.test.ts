import { describe, expect, it } from "vitest";
import { coverAccountLinks } from "./cover-links";

describe("cover account links", () => {
  it("offers account actions to a guest and workspace actions to a member", () => {
    expect(coverAccountLinks(false).map((link) => link.label)).toEqual([
      "Créer un compte",
      "Se connecter",
      "En savoir plus",
    ]);
    expect(coverAccountLinks(false).find((link) => link.label === "En savoir plus")?.href).toBe("/decouvrir");
    expect(coverAccountLinks(true).map((link) => [link.label, link.href])).toEqual([
      ["Créer une affiche", "/create"],
      ["Mon espace", "/dashboard"],
    ]);
  });
});