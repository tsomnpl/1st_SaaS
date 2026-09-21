import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  emailsMatch,
  getPrimaryVerifiedEmail,
  isConfiguredAdmin,
  isValidAdminEmail,
} from "./admin";
import { postAuthDestination } from "./redirects";

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
    expect(isValidAdminEmail("owner@example.com")).toBe(true);
    expect(isValidAdminEmail("not-an-email")).toBe(false);
  });

  it("uses only the verified primary Clerk email", () => {
    expect(
      getPrimaryVerifiedEmail({
        primaryEmailAddress: {
          emailAddress: "owner@example.com",
          verification: { status: "verified" },
        },
        emailAddresses: [
          {
            id: "idn_unverified",
            emailAddress: "other@example.com",
            verification: { status: "unverified" },
          },
        ],
      }),
    ).toBe("owner@example.com");
    expect(
      getPrimaryVerifiedEmail({
        primaryEmailAddress: {
          emailAddress: "owner@example.com",
          verification: { status: "unverified" },
        },
      }),
    ).toBeNull();
  });

  it("grants admin only via configured email or clerk id", () => {
    expect(isConfiguredAdmin({ email: "owner@example.com", clerkUserId: "user_x" })).toBe(true);
    expect(isConfiguredAdmin({ email: "other@example.com", clerkUserId: "user_admin" })).toBe(true);
    expect(isConfiguredAdmin({ email: "other@example.com", clerkUserId: "user_x" })).toBe(false);
    expect(isConfiguredAdmin({ email: null, clerkUserId: null })).toBe(false);
  });

  it("fails closed when ADMIN_EMAIL is missing or invalid", () => {
    delete process.env.ADMIN_EMAIL;
    expect(isConfiguredAdmin({ email: "owner@example.com", clerkUserId: "user_admin" })).toBe(false);
    process.env.ADMIN_EMAIL = "   ";
    expect(isConfiguredAdmin({ email: "owner@example.com", clerkUserId: "user_admin" })).toBe(false);
    process.env.ADMIN_EMAIL = "not-an-email";
    expect(isConfiguredAdmin({ email: "not-an-email", clerkUserId: "user_admin" })).toBe(false);
  });

  it("never treats a signed-in user as admin by default", () => {
    expect(isConfiguredAdmin({ email: "attacker@example.com", clerkUserId: "user_attacker" })).toBe(false);
  });

  it("sends only admins to /admin after sign-in", () => {
    expect(postAuthDestination({ isAdmin: false })).toBe("/dashboard");
    expect(postAuthDestination({ isAdmin: true })).toBe("/admin");
    expect(postAuthDestination({ isAdmin: false, requested: "/create" })).toBe("/create");
    expect(postAuthDestination({ isAdmin: false, requested: "/admin" })).toBe("/forbidden");
    expect(postAuthDestination({ isAdmin: true, requested: "/history" })).toBe("/history");
    expect(postAuthDestination({ isAdmin: false, requested: "https://evil.test" })).toBe("/dashboard");
  });
});
