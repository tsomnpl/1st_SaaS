import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarChart, barHeight } from "./admin-charts";

describe("BarChart", () => {
  it("gives every day a visible pixel mark, including zeros", () => {
    expect(barHeight(0, 12)).toBe(3);
    expect(barHeight(12, 12)).toBe(144);
    expect(barHeight(1, 100)).toBeGreaterThanOrEqual(8);

    const html = renderToStaticMarkup(
      createElement(BarChart, {
        label: "Revenus",
        color: "#6D28D9",
        points: [
          { label: "2026-10-01", value: 0 },
          { label: "2026-10-02", value: 12 },
        ],
      }),
    );

    expect(html).toContain("height:3px");
    expect(html).toContain("height:144px");
    expect(html).toContain("#6D28D9");
    expect(html).not.toMatch(/height:\d+%/);
  });
});
