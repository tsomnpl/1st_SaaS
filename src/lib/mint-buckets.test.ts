import { describe, expect, it } from "vitest";
import { sortMintBucketsFefo } from "./mint-buckets";

describe("mint FEFO", () => {
  it("consumes the soonest-expiring bucket before never-expiring mints", () => {
    const expiring = { id: "soon", expiresAt: new Date("2026-10-01"), createdAt: new Date("2026-09-20") };
    const later = { id: "later", expiresAt: new Date("2026-12-01"), createdAt: new Date("2026-09-01") };
    const perpetual = { id: "forever", expiresAt: null, createdAt: new Date("2026-01-01") };
    const ordered = sortMintBucketsFefo([perpetual, later, expiring]);
    expect(ordered.map((bucket) => bucket.id)).toEqual(["soon", "later", "forever"]);
  });
});
