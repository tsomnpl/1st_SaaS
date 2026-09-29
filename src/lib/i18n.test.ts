import { describe, expect, it } from "vitest";
import { copy, parseLocale } from "@/lib/i18n";

function leaves(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => leaves(item, `${prefix}${index}.`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => leaves(item, `${prefix}${key}.`));
  }
  return [prefix];
}

describe("locale copy", () => {
  it("keeps french as the default", () => {
    expect(parseLocale(null)).toBe("fr");
    expect(parseLocale("fr")).toBe("fr");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("de")).toBe("fr");
  });

  it("gives english the same phrases as french", () => {
    expect(leaves(copy.en)).toEqual(leaves(copy.fr));
  });
});
