import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEASONAL_CAMPAIGNS,
  campaignIsEligible,
  seasonalChoiceNote,
  splitReferenceIds,
} from "./seasonal";

const campaigns = DEFAULT_SEASONAL_CAMPAIGNS.map((item) => ({ ...item }));

describe("seasonal campaigns", () => {
  it("ships the five periods and leaves Ramadan without invented dates", () => {
    expect(campaigns.map((item) => item.slug)).toEqual([
      "rentree-scolaire",
      "fetes-fin-annee",
      "ramadan",
      "fete-nationale-togo",
      "fete-nationale-benin",
    ]);
    const ramadan = campaigns.find((item) => item.slug === "ramadan");
    expect(ramadan?.active).toBe(false);
    expect(ramadan?.startDate).toBeNull();
    expect(ramadan?.endDate).toBeNull();
    expect(ramadan?.movable).toBe(true);
    expect(campaigns.find((item) => item.slug === "fete-nationale-togo")?.markets).toEqual(["TG"]);
    expect(campaigns.find((item) => item.slug === "fete-nationale-benin")?.markets).toEqual(["BJ"]);
  });

  it("matches an open campaign only for the right market and domain", () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    const rentree = campaigns.find((item) => item.slug === "rentree-scolaire")!;
    expect(campaignIsEligible(rentree, { now, domain: "Education & Formation", market: "TG" })).toBe(true);
    expect(campaignIsEligible(rentree, { now, domain: "Immobilier", market: "TG" })).toBe(false);
    const togo = campaigns.find((item) => item.slug === "fete-nationale-togo")!;
    const nationalDay = new Date("2026-04-27T12:00:00.000Z");
    expect(campaignIsEligible(togo, { now: nationalDay, domain: "Evenementiel", market: "TG" })).toBe(true);
    expect(campaignIsEligible(togo, { now: nationalDay, domain: "Evenementiel", market: "BJ" })).toBe(false);
    expect(campaignIsEligible(togo, { now: nationalDay, domain: "Evenementiel", market: null })).toBe(false);
    expect(campaignIsEligible(togo, { now, domain: "Evenementiel", market: "TG" })).toBe(false);
    expect(campaigns.filter((item) => campaignIsEligible(item, { now, domain: "Finance & Fintech" }))).toHaveLength(0);
  });

  it("records a refusal and an acceptance without borrowing another domain reference", () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    const refused = seasonalChoiceNote({
      campaigns,
      now,
      domain: "Education & Formation",
      market: "BJ",
      decline: true,
      availableReferenceIds: ["edu-1"],
    });
    expect(refused).toMatchObject({ accepted: false, slug: "rentree-scolaire", styleProfile: null });

    const pinned = campaigns.map((item) =>
      item.slug === "rentree-scolaire" ? { ...item, referenceIds: ["missing-poster", "edu-1"] } : item,
    );
    const accepted = seasonalChoiceNote({
      campaigns: pinned,
      now,
      domain: "Education & Formation",
      slug: "rentree-scolaire",
      availableReferenceIds: ["edu-1"],
    });
    expect(accepted?.accepted).toBe(true);
    expect(accepted?.styleProfile?.campaign).toBe("rentree-scolaire");
    expect(accepted?.usedReferenceIds).toEqual(["edu-1"]);
    expect(accepted?.missingReferenceIds).toEqual(["missing-poster"]);
    expect(splitReferenceIds(["other-domain"], ["edu-1"]).usedReferenceIds).toEqual([]);
  });
});
