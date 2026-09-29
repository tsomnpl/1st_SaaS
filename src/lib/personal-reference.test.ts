import { describe, expect, it } from "vitest";
import { OFFICIAL_PLANS } from "@/lib/plans";
import {
  assertPersonalReferenceAccess,
  PERSONAL_REFERENCE_PLAN_CODES,
  planAllowsPersonalReference,
} from "@/lib/personal-reference";

describe("personal reference access", () => {
  it("reserves the feature for the 20 000 and 25 000 FCFA packs", () => {
    expect(PERSONAL_REFERENCE_PLAN_CODES).toEqual(["PACK_20K", "PACK_25K"]);
    expect(planAllowsPersonalReference("PACK_20K")).toBe(true);
    expect(planAllowsPersonalReference("PACK_25K")).toBe(true);
    for (const plan of OFFICIAL_PLANS) {
      if (plan.code === "PACK_20K" || plan.code === "PACK_25K") {
        expect(plan.personalReference).toBe(true);
        expect(plan.mintAmount).toBe(plan.code === "PACK_20K" ? 15 : 20);
      } else {
        expect(plan.personalReference).toBe(false);
      }
    }
  });

  it("rejects a personal poster when the account has no qualifying pack", () => {
    expect(() => assertPersonalReferenceAccess(false, "data:image/png;base64,AAAA")).toThrow(
      "PERSONAL_REFERENCE_LOCKED",
    );
  });

  it("allows a personal poster only with server-side access", () => {
    expect(() => assertPersonalReferenceAccess(true, "data:image/png;base64,AAAA")).not.toThrow();
    expect(() => assertPersonalReferenceAccess(false, undefined)).not.toThrow();
  });
});
