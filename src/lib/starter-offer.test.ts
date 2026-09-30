import { describe, expect, it } from "vitest";
import { isStarterOfferLive, starterOfferDeadline } from "@/lib/starter-offer";

describe("starter offer window", () => {
  const start = new Date("2026-10-01T08:00:00.000Z");

  it("ends exactly after the chosen number of days", () => {
    expect(starterOfferDeadline(7, start).toISOString()).toBe("2026-10-08T08:00:00.000Z");
    expect(() => starterOfferDeadline(0, start)).toThrow("PLAN_INVALID");
  });

  it("stays open during the window and closes itself at the end", () => {
    const offerEndsAt = starterOfferDeadline(30, start);
    expect(isStarterOfferLive({ active: true, offerEndsAt }, new Date("2026-10-15T00:00:00.000Z"))).toBe(true);
    expect(isStarterOfferLive({ active: true, offerEndsAt }, new Date("2026-10-31T08:00:00.000Z"))).toBe(false);
    expect(isStarterOfferLive({ active: false, offerEndsAt }, new Date("2026-10-02T00:00:00.000Z"))).toBe(false);
    expect(isStarterOfferLive({ active: true, offerEndsAt: null }, start)).toBe(false);
  });
});
