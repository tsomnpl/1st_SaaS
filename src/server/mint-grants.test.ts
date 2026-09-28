import { describe, expect, it } from "vitest";
import { isMissingPendingMintGrantTable } from "./mint-grants";

describe("pending mint grant table", () => {
  it("treats a missing PendingMintGrant table as skippable", () => {
    expect(
      isMissingPendingMintGrantTable({
        code: "P2021",
        message: "The table `public.PendingMintGrant` does not exist in the current database.",
      }),
    ).toBe(true);
    expect(
      isMissingPendingMintGrantTable(new Error('relation "PendingMintGrant" does not exist')),
    ).toBe(true);
  });

  it("does not hide other database errors", () => {
    expect(isMissingPendingMintGrantTable(new Error("UNAUTHORIZED"))).toBe(false);
    expect(isMissingPendingMintGrantTable({ code: "P2002", message: "Unique constraint" })).toBe(false);
    expect(
      isMissingPendingMintGrantTable({
        code: "P2021",
        message: "The table `public.BrandKit` does not exist in the current database.",
      }),
    ).toBe(false);
  });
});
