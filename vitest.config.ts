import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

function loadEnvFile() {
  const env: Record<string, string> = {};
  try {
    const raw = readFileSync(path.resolve(__dirname, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[trimmed.slice(0, index)] = value;
    }
  } catch {
    return env;
  }
  return env;
}

export default defineConfig({
  test: {
    environment: "node",
    env: loadEnvFile(),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
