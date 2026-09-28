import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlyerMint",
    short_name: "FlyerMint",
    start_url: "/",
    display: "standalone",
    background_color: "#1E293B",
    theme_color: "#10B981",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
