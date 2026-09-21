import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/creations", "/privacy", "/terms"],
      disallow: [
        "/c/",
        "/api/",
        "/dashboard",
        "/create",
        "/history",
        "/checkout",
        "/profile",
        "/sign-in",
        "/sign-up",
        "/payment/",
      ],
    },
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
