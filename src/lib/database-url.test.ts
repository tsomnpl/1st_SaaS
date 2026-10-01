import { describe, expect, it } from "vitest";
import { serverlessDatabaseUrl } from "@/lib/database-url";

describe("serverlessDatabaseUrl", () => {
  it("leaves a local url unchanged", () => {
    const raw = "postgresql://user:secret@localhost:5432/flyermint";
    expect(serverlessDatabaseUrl(raw, false)).toBe(raw);
  });

  it("limits the pool on Vercel without rewriting the password", () => {
    const raw = "postgresql://user:p%40ss@localhost:5432/flyermint?sslmode=require";
    expect(serverlessDatabaseUrl(raw, true)).toBe(
      "postgresql://user:p%40ss@localhost:5432/flyermint?sslmode=require&connection_limit=1&pool_timeout=20",
    );
  });

  it("turns prepared statements off for a pooler host", () => {
    const raw = "postgresql://user:secret@ep-cool-pooler.neon.tech:5432/flyermint";
    expect(serverlessDatabaseUrl(raw, true)).toContain("pgbouncer=true");
    expect(serverlessDatabaseUrl(raw, true)).toContain("connection_limit=1");
  });
});
