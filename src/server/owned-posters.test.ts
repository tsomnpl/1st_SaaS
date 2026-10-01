import { describe, expect, it } from "vitest";
import { posterDomain, posterTitle } from "@/server/owned-posters";

describe("poster facts", () => {
  it("reads a title and ignores an empty brief", () => {
    expect(posterTitle({ title: "Mariage Awa" }, "Sans titre")).toBe("Mariage Awa");
    expect(posterTitle(null, "Sans titre")).toBe("Sans titre");
    expect(posterTitle("je veux une affiche", "Sans titre")).toBe("Sans titre");
  });

  it("reads a domain only when it is text", () => {
    expect(posterDomain({ domain: "mariage" })).toBe("mariage");
    expect(posterDomain({ domain: 4 })).toBe("");
  });
});