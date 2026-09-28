import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { emailsMatch, isConfiguredAdmin } from "./admin";

describe("admin identity", () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "owner@example.com";
    process.env.ADMIN_CLERK_USER_IDS = "user_admin";
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it("matches emails without leaking case", () => {
    expect(emailsMatch("Owner@Example.com", "owner@example.com")).toBe(true);
    expect(emailsMatch("a@b.com", "c@d.com")).toBe(false);
    expect(emailsMatch("", "owner@example.com")).toBe(false);
  });

  it("grants admin from the clerk id or the configured email", () => {
    expect(isConfiguredAdmin({ email: "owner@example.com", clerkUserId: "user_x" })).toBe(true);
    expect(isConfiguredAdmin({ email: "Owner@Example.com", clerkUserId: "user_x" })).toBe(true);
    expect(isConfiguredAdmin({ email: "other@example.com", emails: ["owner@example.com"], clerkUserId: "user_x" })).toBe(true);
    expect(isConfiguredAdmin({ email: "other@example.com", clerkUserId: "user_admin" })).toBe(true);
    expect(isConfiguredAdmin({ email: "other@example.com", clerkUserId: "user_x" })).toBe(false);
    expect(isConfiguredAdmin({ email: null, clerkUserId: null })).toBe(false);
  });

  it("never treats a self-declared role as admin", () => {
    expect(isConfiguredAdmin({ email: "attacker@example.com", clerkUserId: "user_attacker" })).toBe(false);
  });
});
