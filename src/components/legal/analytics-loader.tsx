"use client";

import { useEffect } from "react";
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";

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
    const revoke = () => {
      document.getElementById("fm-analytics")?.remove();
    };
    if (window.localStorage.getItem(COOKIE_CONSENT_KEY) === "analytics") load();
    window.addEventListener(COOKIE_CONSENT_EVENT, load);
    window.addEventListener("fm-analytics-revoke", revoke);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, load);
      window.removeEventListener("fm-analytics-revoke", revoke);
    };
  }, [domain]);
  return null;
}
