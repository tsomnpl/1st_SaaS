import { describe, expect, it } from "vitest";
import { acknowledgedAlertIds } from "@/lib/admin-alerts";

describe("admin alert acknowledgement", () => {
  it("keeps only the alerts that are still on screen", () => {
    expect(acknowledgedAlertIds(["pending-payments", "old-one", 4], ["pending-payments", "payment-errors"])).toEqual([
      "pending-payments",
    ]);
  });

  it("starts empty when nothing was stored", () => {
    expect(acknowledgedAlertIds(null, ["pending-payments"])).toEqual([]);
  });
});
