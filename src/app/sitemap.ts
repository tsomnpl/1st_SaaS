import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  return ["", "/pricing", "/creations", "/help", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
