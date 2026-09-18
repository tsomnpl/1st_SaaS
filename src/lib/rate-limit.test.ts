import { describe, expect, it } from "vitest";
import { rateLimit, resetRateLimitForTests } from "./rate-limit";

describe("rateLimit", () => {
  it("blocks after the window limit", () => {
    resetRateLimitForTests();
    const first = rateLimit({ key: "t:gen", limit: 2, windowMs: 60_000 });
    const second = rateLimit({ key: "t:gen", limit: 2, windowMs: 60_000 });
    const third = rateLimit({ key: "t:gen", limit: 2, windowMs: 60_000 });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(false);
  });
});
