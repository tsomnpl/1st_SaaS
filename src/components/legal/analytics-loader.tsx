"use client";

import { useEffect } from "react";

export function AnalyticsLoader({ domain }: { domain?: string }) {
  useEffect(() => {
    if (!domain) return;
    const load = () => {
      if (document.getElementById("fm-analytics")) return;
      const script = document.createElement("script");
      script.id = "fm-analytics";
      script.defer = true;
      script.setAttribute("data-domain", domain);
      script.src = "https://plausible.io/js/script.js";
      document.body.appendChild(script);
    };
    if (window.localStorage.getItem("fm-cookie-consent") === "analytics") load();
    window.addEventListener("fm-analytics-consent", load);
    return () => window.removeEventListener("fm-analytics-consent", load);
  }, [domain]);
  return null;
}
