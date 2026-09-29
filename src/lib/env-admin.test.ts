import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAdminPrivatePath } from "@/lib/env";

describe("admin private path", () => {
  it("stays closed when the variable is empty", () => {
    expect(resolveAdminPrivatePath(undefined)).toBeNull();
    expect(resolveAdminPrivatePath(null)).toBeNull();
    expect(resolveAdminPrivatePath("")).toBeNull();
    expect(resolveAdminPrivatePath("   ")).toBeNull();
  });

  it("uses only the value provided by the environment", () => {
    expect(resolveAdminPrivatePath("studio-secret-path")).toBe("studio-secret-path");
  });

  it("does not keep a predictable fallback in the source", () => {
    const source = readFileSync(resolve(process.cwd(), "src/lib/env.ts"), "utf8");
    expect(source).not.toContain("ops-k7m2qx");
    expect(resolveAdminPrivatePath("")).not.toBe("ops-k7m2qx");
  });
});
