"use client";

import { useEffect, useState } from "react";

export const COOKIE_CONSENT_KEY = "fm-cookie-consent";
export const COOKIE_CHOICE_EVENT = "fm-cookie-choice";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    setVisible(!stored);
    if (stored === "analytics") {
      window.dispatchEvent(new Event("fm-analytics-consent"));
    }
  }, []);

  function choose(value: "necessary" | "analytics") {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setVisible(false);
    window.dispatchEvent(new Event(COOKIE_CHOICE_EVENT));
    if (value === "analytics") {
      window.dispatchEvent(new Event("fm-analytics-consent"));
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600">
          FlyerMint utilise des cookies nécessaires à la connexion. Les statistiques optionnelles
          ne sont chargées que si tu les acceptes.{" "}
          <a href="/confidentialite#cookies" className="font-semibold text-[#6D28D9]">
            Politique de cookies
          </a>
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => choose("necessary")}>
            Nécessaires
          </button>
          <button type="button" className="btn-primary" onClick={() => choose("analytics")}>
            Accepter les stats
          </button>
        </div>
      </div>
    </div>
  );
}
