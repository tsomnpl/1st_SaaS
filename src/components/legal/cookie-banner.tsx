"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  COOKIE_SETTINGS_EVENT,
  type CookieConsentValue,
} from "@/lib/cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    setVisible(!stored);
    if (stored === "analytics") {
      window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    }
    const reopen = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  function choose(value: CookieConsentValue) {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setVisible(false);
    if (value === "analytics") {
      window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
      return;
    }
    window.dispatchEvent(new Event("fm-analytics-revoke"));
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur"
      role="dialog"
      aria-labelledby="fm-cookie-title"
      aria-describedby="fm-cookie-desc"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p id="fm-cookie-title" className="text-sm font-semibold text-[#111827]">
            Cookies
          </p>
          <p id="fm-cookie-desc" className="mt-1 text-sm text-slate-600">
            Les cookies nécessaires (connexion) sont toujours actifs. Les statistiques de pages
            sont optionnelles et ne se chargent que si tu les acceptes.{" "}
            <Link href="/cookies" className="font-semibold text-[#20C997] underline-offset-2 hover:underline">
              Politique de cookies
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => choose("necessary")}>
            Uniquement nécessaires
          </button>
          <button type="button" className="btn-primary" onClick={() => choose("analytics")}>
            Accepter les statistiques
          </button>
        </div>
      </div>
    </div>
  );
}
