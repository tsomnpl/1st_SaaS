import { describe, expect, it, afterEach } from "vitest";
import { getAdminBasePath, getAdminPrivatePath } from "./env";
import { readFileSync } from "node:fs";

describe("admin route configuration", () => {
  const previous = process.env.ADMIN_PRIVATE_PATH;

  afterEach(() => {
    if (previous === undefined) delete process.env.ADMIN_PRIVATE_PATH;
    else process.env.ADMIN_PRIVATE_PATH = previous;
  });

  it("uses /admin as the canonical studio path", () => {
    expect(getAdminBasePath()).toBe("/admin");
  });

  it("never falls back to a committed secret path", () => {
    delete process.env.ADMIN_PRIVATE_PATH;
    expect(getAdminPrivatePath()).toBe("");
    const envSource = readFileSync("src/lib/env.ts", "utf8");
    const proxy = readFileSync("src/proxy.ts", "utf8");
    expect(envSource).not.toContain("ops-k7m2qx");
    expect(proxy).not.toContain("ops-k7m2qx");
    expect(envSource).not.toMatch(/ADMIN_PRIVATE_PATH.*\|\|/);
  });
});
