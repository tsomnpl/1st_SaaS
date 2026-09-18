import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/c/", "/api/", "/dashboard", "/create", "/history", "/checkout"],
    },
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
