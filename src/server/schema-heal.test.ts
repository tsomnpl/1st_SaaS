import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { isMissingColumn } from "@/server/schema-heal";

describe("isMissingColumn", () => {
  it("recognizes a missing column from Prisma", () => {
    const error = new Prisma.PrismaClientKnownRequestError("column missing", {
      code: "P2022",
      clientVersion: "0",
    });
    expect(isMissingColumn(error)).toBe(true);
  });

  it("ignores a connection failure", () => {
    expect(isMissingColumn(new Error("Can't reach database server"))).toBe(false);
  });
});
